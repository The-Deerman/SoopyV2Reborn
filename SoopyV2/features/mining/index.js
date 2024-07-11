import fetch from "../../../SoopyV2/utils/networkUtils";

import Feature from "../../featureClass/class";

import *as stringUtils from "../../utils/stringUtils";
import *as utils from "../../utils/utils";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import ToggleSetting from "../settings/settingThings/toggle";
import { numberWithCommas, timeSince2 } from "../../utils/numberUtils";
import socketConnection from "../../socketConnection";
import { drawCoolWaypoint } from "../../utils/renderUtils";

class Mining extends Feature {
    constructor() {
        super();
    }

    isInCH() {
        if (!this.FeatureManager || !this.FeatureManager.features["dataLoader"]) return false;
        return this.FeatureManager.features["dataLoader"].class.area === "Crystal Hollows";
    }

    onEnable() {
        this.initVariables();

        this.hudElements = [];

        this.guessBalHp = new ToggleSetting("Show bal hp", "This will attempt to show remaining hp on bal (guessed)", true, "bal_hp", this);
        this.balRespawnHud = new ToggleSetting("Show bal hp and respawn timer HUD", "This will add a HUD element with bal's hp and respawn timer", true, "bal_hud", this);
        this.balHudElement = new HudTextElement().
            setToggleSetting(this.balRespawnHud).
            setLocationSetting(new LocationSetting("HUD Location", "Allows you to edit the location of the bal info", "bal_hud_location", this, [10, 50, 1, 1]).
                requires(this.balRespawnHud).
                editTempText("&6Bal&7> &f172/250"));
        this.hudElements.push(this.balHudElement);
        this.balPetAlert = new ToggleSetting("Bal pet alert", "Give a notification on screen + sound when you drop a bal pet", true, "bal_alert", this);

        this.showUnlockedGemstoneSlots = new ToggleSetting("Show unlocked gemstone slots", "This will show the unlocked gemstone slots of an item.", true, "unlocked_gemstones", this);
        this.showContainedGemstoneSlots = new ToggleSetting("Show contained gemstones", "This will show the gemstones currently on an item.", true, "contained_gemstones", this);


        this.compactProgressHud = new ToggleSetting("Show compact blocks in the current session", "This will add a HUD element with the compact progress", true, "compact_progress_hud", this);
        this.compactHudElement = new HudTextElement().
            setToggleSetting(this.compactProgressHud).
            setLocationSetting(new LocationSetting("HUD Location", "Allows you to edit the location of the compact progress", "compact_progress_location", this, [10, 50, 1, 1]).
                requires(this.compactProgressHud).
                editTempText("&6Compact Session&7> &f12,345"));
        this.hudElements.push(this.compactHudElement);
        this.compactProgressHudOnlyWhenMoreThan0 = new ToggleSetting("Only show compact progress when it is above 0", "So that you dont need to disable it when you start doing something else", true, "compact_progress_disable_0", this).requires(this.compactProgressHud);

        this.gemstoneMoneyHud = new ToggleSetting("Show $/h made from gemstone mining", "This will add a HUD element with the gemstone $/h", true, "gemstone_money_hud", this);
        this.gemstoneMoneyHudElement = new HudTextElement().
            setToggleSetting(this.gemstoneMoneyHud).
            setLocationSetting(new LocationSetting("HUD Location", "Allows you to edit the location of the gemstone $/h", "gemstone_money_location", this, [10, 60, 1, 1]).
                requires(this.gemstoneMoneyHud).
                editTempText("&6$/h&7> &f$12,345,678\n&6$ made&7> &f$123,456,789\n&6Time tracked&7> &f123m"));
        this.gemstoneMoneyHudMoneyOnly = new ToggleSetting("Force npc price", "(Eg if u are ironman)", false, "gemstone_money_hud_npc", this).requires(this.gemstoneMoneyHud);
        this.hudElements.push(this.gemstoneMoneyHudElement);

        this.nextChEvent = new ToggleSetting("Show the current and next crystal hollows event", "(syncs the data between all users in ch)", true, "chevent_hud", this);
        this.nextChEventElement = new HudTextElement().
            setToggleSetting(this.nextChEvent).
            setLocationSetting(new LocationSetting("HUD Location", "Allows you to edit the location of the hud element", "chevent_hud_location", this, [10, 70, 1, 1]).
                requires(this.nextChEvent).
                editTempText("&6Event&7> &f??? &7->&f ???"));
        this.hudElements.push(this.nextChEventElement);


        this.metalDetectorSolver = new ToggleSetting("Metal detector solver", "", true, "metal_detector_solver", this).contributor("tenios", ["- idea that chests are in same locations every time", "- locations of chests", "- finding offset of divan mines"]);
        this.alertTools = new ToggleSetting("Alert when all 4 tools in inventory", "", true, "alert_tools", this);

        this.seenBalDamages = [];
        this.balHP = 250;
        this.lastBalAlive = 0;
        this.balDespawnDebounce = 0;

        this.predictedChestLocations = [];

        this.totalCompact = 0;
        this.compactProgress = 0;
        this.compactItems = 0;

        this.armourstandClass = Java.type("net.minecraft.entity.item.EntityArmorStand").class;

        this.registerEvent("tick", this.tick);
        this.registerEvent("itemTooltip", this.itemTooltipEvent).registeredWhen(() => this.showContainedGemstoneSlots.getValue() || this.showUnlockedGemstoneSlots.getValue());
        this.registerEvent("renderWorld", this.renderWorld).registeredWhen(() => this.guessBalHp.getValue() || this.metalDetectorSolver.getValue());

        this.registerChat("&r&6&lRARE DROP! &r&eA Bal Pet dropped!&r", () => {
            if (this.balPetAlert.getValue()) {
                World.playSound("random.orb", 1, 1);
                Client.showTitle("\xA7r\xA7c\xA7o\xA7r\xA76\xA7lRARE DROP! \xA7r\xA7eA Bal Pet dropped!\xA7r", "", 20, 50, 20);
            }
        });
        this.registerChat("&r&c&oThe bosses outer shell looks to be weakening!&r", () => {
            this.balHP = 200;
        });
        this.registerChat("&r&c&oHalf way there! The boss is starting to become weaker!&r", () => {
            this.balHP = 125;
        });
        this.registerChat("&r&c&oNearly there! The boss is shaking it can't last much longer!&r", () => {
            this.balHP = 75;
        });
        this.registerChat("&r&c&oThe boss looks weak and tired and retreats into the lava...&r", () => {
            this.balHP = 0;
        });

        let startingTime = -1;
        let money = 0;
        let gemstoneCosts = {};
        let lastMined = 0;
        this.registerChat("&r&d&lPRISTINE! &r&fYou found &r${*} Flawed ${type} Gemstone &r&8x${num}&r&f!&r", (type, num, event) => {

            let id = "FLAWED_" + type.toUpperCase() + "_GEM";
            let number = parseInt(num);

            lastMined = Date.now();

            if (!this.gemstoneMoneyHud.getValue()) return;

            if (startingTime === 0) return;
            if (startingTime === -1) {
                startingTime = 0;
                fetch("https://api.hypixel.net/skyblock/bazaar").json().then((data) => {
                    startingTime = Date.now();

                    Object.keys(data.products).forEach((id) => {
                        if (id.startsWith("FLAWED_")) {
                            gemstoneCosts[id] = Math.max(240, data.products[id].quick_status.sellPrice);
                            if (this.gemstoneMoneyHudMoneyOnly.getValue()) {
                                gemstoneCosts[id] = 240;
                            }

                        }
                    });
                });
                return;
            }

            money += gemstoneCosts[id] * number;

            let moneyPerHour = Math.floor(money / ((Date.now() - startingTime) / (1000 * 60 * 60)));
            let moneyMade = Math.floor(money);
            let timeTracked = timeSince2(startingTime);

            this.gemstoneMoneyHudElement.setText("&6$/h&7> &f$" + numberWithCommas(moneyPerHour) + "\n&6$ made&7> &f$" + numberWithCommas(moneyMade) + "\n&6Time tracked&7> &f" + timeTracked);
        });
        this.registerStep(false, 10, () => {
            if (lastMined && Date.now() - lastMined > 2 * 60000) {
                money = 0;
                startingTime = -1;
                lastMined = 0;
                this.gemstoneMoneyHudElement.setText("");
            }

            this.nextChEventElement.setText("&6Event&7> &f" + socketConnection.chEvent.join(" &7->&f "));
        });
        this.registerCommand("soopyclearminingprofit", () => {
            money = 0;
            startingTime = -1;
            lastMined = 0;
            this.gemstoneMoneyHudElement.setText("");
            ChatLib.chat(this.FeatureManager.messagePrefix + "Cleared gemstone profit data!");
        });

        let lastWorldChange = 0;

        this.registerEvent("worldLoad", () => {
            lastWorldChange = Date.now();
        });

        this.registerChat("&r&f${spaces}&r&${color}&l${event} ENDED!&r", (spaces, color, event) => {
            if (Date.now() - lastWorldChange < 5000) return;
            if (!this.isInCH()) return;

            socketConnection.sendCHEventData(event.trim(), false);
        });
        this.registerChat("&r&f${spaces}&r&${color}&l${event} STARTED!&r", (spaces, color, event) => {
            if (Date.now() - lastWorldChange < 5000) return;
            if (!this.isInCH()) return;

            socketConnection.sendCHEventData(event.trim(), true);
        });

        this.chestCoords = JSON.parse(FileLib.read("SoopyV2", "features/mining/coords.json"));

        let lastLoc = [0, 0, 0];

        this.baseCoordinates = undefined;

        this.lastSearchedForBase = 0;

        let ignoreLocation = undefined;

        this.registerEvent("worldLoad", () => {
            lastLoc = [0, 0, 0];

            this.baseCoordinates = undefined;

            this.lastSearchedForBase = 0;

            this.predictedChestLocations = [];

            ignoreLocation = undefined;
        });

        let registerActionBar = this.registerCustom("actionbar", (dist) => {
            let lapis = false;
            let diamond = false;
            let emerald = false;
            let gold = false;
            Player.getInventory().getItems().forEach((i) => {
                if (i && i.getName().includes("Scavenged Lapis")) {
                    lapis = true;
                }
                if (i && i.getName().includes("Scavenged Diamond")) {
                    diamond = true;
                }
                if (i && i.getName().includes("Scavenged Emerald")) {
                    emerald = true;
                }
                if (i && i.getName().includes("Scavenged Golden")) {
                    gold = true;
                }
            });

            if (this.alertTools.getValue() && lapis && diamond && gold && emerald) Client.showTitle("\xA7cALL TOOLS", "", 10, 40, 20);

            if (!this.metalDetectorSolver.getValue()) return;
            let distance = parseFloat(dist);
            if (!this.baseCoordinates) this.findBaseCoordinates();

            if (lastLoc[0] !== Player.getX() || lastLoc[1] !== Player.getY() || lastLoc[2] !== Player.getZ()) {
                lastLoc = [Player.getX(), Player.getY(), Player.getZ()];
                return;
            }

            this.predictedChestLocations = [];

            this.chestCoords.forEach((coordinates) => {
                let currentDistance = Math.hypot(Player.getX() - (this.baseCoordinates[0] - coordinates[0]), Player.getY() - (this.baseCoordinates[1] - coordinates[1] + 1), Player.getZ() - (this.baseCoordinates[2] - coordinates[2]));

                if (Math.round(currentDistance * 10) / 10 === distance) {

                    if ([this.baseCoordinates[0] - coordinates[0], this.baseCoordinates[1] - coordinates[1], this.baseCoordinates[2] - coordinates[2]].join(",") === ignoreLocation) {
                        ignoreLocation = undefined;
                        return;
                    }

                    if (this.predictedChestLocations.length === 0) {
                        World.playSound("note.pling", 100, 2);
                    }

                    this.predictedChestLocations.push([this.baseCoordinates[0] - coordinates[0], this.baseCoordinates[1] - coordinates[1], this.baseCoordinates[2] - coordinates[2]]);
                }
            });
        });
        registerActionBar.trigger.setCriteria("TREASURE: ${rest}").setParameter("contains");

        this.registerChat("&r&aYou found${*}with your &r&cMetal Detector&r&a!&r", () => {
            if (this.predictedChestLocations[0]) ignoreLocation = this.predictedChestLocations[0].join(",");
            this.predictedChestLocations = [];
        });
    }

    findBaseCoordinates() {
        if (Date.now() - this.lastSearchedForBase < 15000) return;
        let x = ~~Player.getX();
        let y = ~~Player.getY();
        let z = ~~Player.getZ();
        for (let i = x - 50; i < x + 50; i++) {
            for (let j = y + 30; j >= y - 30; j--) {
                for (let k = z - 50; k < z + 50; k++) {
                    if (World.getBlockAt(i, j, k).getType().getID() === 156 && World.getBlockAt(i, j + 13, k).getType().getID() === 166) {
                        this.baseCoordinates = this.getBaseCoordinates(i, j + 13, k);
                        return;
                    }
                }
            }
        }
        this.lastSearchedForBase = Date.now();
    }

    getBaseCoordinates(x, y, z) {
        let loop = true;
        let posX = x;
        let posY = y;
        let posZ = z;
        if (World.getBlockAt(x, y, z).getType().getID() !== 166) return [x, y, z];
        while (loop) {
            loop = false;
            if (World.getBlockAt(posX + 1, posY, posZ).getType().getID() == 166) {
                posX++;
                loop = true;
            }
            if (World.getBlockAt(posX, posY - 1, posZ).getType().getID() == 166) {
                posY--;
                loop = true;
            }
            if (World.getBlockAt(posX, posY, posZ + 1).getType().getID() == 166) {
                posZ++;
                loop = true;
            }
        }
        return [posX, posY, posZ];
    }

    itemTooltipEvent(lore, item, event) {
        this.addLore(item);
    }




    addLore(item) {
        if (!item) return;
        if (this.showUnlockedGemstoneSlots.getValue()) {
            let gems = item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getCompoundTag("gems");
            if (gems) {
                let unlockedGems = gems.getTagMap().get("unlocked_slots");

                if (unlockedGems) {

                    if (unlockedGems["func_74745_c"]() === 0) {
                        utils.addLore(item, ChatLib.addColor("&d&lGemstones Unlocked: &f"), ChatLib.addColor("&cNone!"));
                    } else {
                        let gemstoneString = "";

                        for (let i = 0; i < unlockedGems["func_74745_c"](); i++) {
                            let gem = String(unlockedGems["func_150307_f"](i)).split("_");

                            let name = stringUtils.firstLetterCapital(gem[0].toLowerCase());

                            gemstoneString += (gemstoneString === "" ? "" : "&7, &a") + name;
                        }
                        utils.addLore(item, ChatLib.addColor("&d&lGemstones Unlocked: &f"), ChatLib.addColor("&a" + gemstoneString));
                    }
                }
            }
        }
        if (this.showContainedGemstoneSlots.getValue()) {
            let gems = item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getCompoundTag("gems");
            if (gems) {
                let unlockedGems = gems.getTagMap();

                let gemStr = "";

                unlockedGems.keySet().forEach((gem) => {
                    if (gem !== "unlocked_slots" && !gem.endsWith("_gem")) {
                        gem = gem.split("_");

                        let gemName = stringUtils.firstLetterCapital(gems.getString(gem.join("_") + "_gem").toLowerCase()) || stringUtils.firstLetterCapital(gem[0].toLowerCase());

                        let name = stringUtils.firstLetterCapital(gems.getString(gem.join("_")).toLowerCase()) + " " + gemName;


                        gemStr += (gemStr === "" ? "" : "&7, &a") + name;
                    }
                });

                if (gemStr !== "") {
                    utils.addLore(item, ChatLib.addColor("&d&lGemstones: &f"), ChatLib.addColor("&a" + gemStr));
                }
            }
        }
    }

    renderWorld() {
        if (this.guessBalHp.getValue()) {
            if (this.balEntity) Tessellator.drawString(this.balHP + "/250", this.balEntity.getX(), this.balEntity.getY() + 12, this.balEntity.getZ());
        }
        if (!this.metalDetectorSolver.getValue()) return;
        this.predictedChestLocations.forEach((loc) => {
            drawCoolWaypoint(loc[0], loc[1], loc[2], 0, 255, 0, { name: "TREASURE", phase: true });
        });
    }

    tick() {
        let oldCompactItems = this.compactItems;
        let oldTotalCompact = this.totalCompact;
        this.totalCompact = 0;
        this.compactItems = 0;
        let slots = [0, 1, 2, 3, 4, 5, 6, 7, 8];

        slots.forEach((a) => {
            item = Player.getInventory().getStackInSlot(a);
            if (!item) return;
            if (item.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getInteger("compact_blocks")) {
                this.compactItems++;
                this.totalCompact += item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getInteger("compact_blocks");
            }
        });

        if (oldCompactItems === this.compactItems) {
            this.compactProgress += this.totalCompact - oldTotalCompact;
        }
        if (this.compactItems === 0) {
            this.compactProgress = 0;
        }

        if (this.compactProgress === 0 && this.compactProgressHudOnlyWhenMoreThan0.getValue()) {
            this.compactHudElement.setText("");
        } else {
            this.compactHudElement.setText("&6Compact Session&7> &f" + numberWithCommas(this.compactProgress));
        }


        if (!this.FeatureManager.features["dataLoader"]) return;
        if (this.guessBalHp.getValue() || this.balRespawnHud.getValue()) {
            if (this.FeatureManager.features["dataLoader"].class.area === "Crystal Hollows" && this.FeatureManager.features["dataLoader"].class.areaFine === "Khazad-dm") {

                this.balEntity = undefined;
                World.getAllEntities().filter((a) => a.getName() === "Magma Cube").filter((a) => a.getEntity()["func_70809_q"]() > 10).forEach((bal) => {

                    this.balEntity = bal;
                });
                if (this.balEntity) {
                    this.balDespawnDebounce = 0;
                    if (this.lastBalAlive !== 0) {
                        this.lastBalAlive = 0;
                    }
                    World.getAllEntitiesOfType(this.armourstandClass).forEach((e) => {
                        if (Math.abs(e.getX() - this.balEntity.getX()) <= 5 && Math.abs(e.getZ() - this.balEntity.getZ()) <= 5 && Math.abs(e.getY() - (this.balEntity.getY() + 12)) <= 5) {
                            if (!this.seenBalDamages.includes(e.getUUID())) {
                                this.balHP--;
                                this.seenBalDamages.push(e.getUUID());
                            }
                        }
                    });
                } else {
                    this.balDespawnDebounce++;
                    if (this.balDespawnDebounce > 10) {
                        this.seenBalDamages = [];
                        this.balHP = 250;
                        if (this.lastBalAlive === 0) this.lastBalAlive = Date.now();
                    }
                }
            }
        }

        if (this.balRespawnHud.getValue() && this.FeatureManager.features["dataLoader"].class.area === "Crystal Hollows" && this.FeatureManager.features["dataLoader"].class.areaFine === "Khazad-dm") {
            if (this.balEntity) {
                this.balHudElement.setText("&6Bal&7> &f" + this.balHP + "/250");
            } else {
                this.balHudElement.setText("&6Bal&7> &f" + Math.max(0, Math.floor((290000 - (Date.now() - this.lastBalAlive)) / 1000)) + "s");
            }
        } else {
            this.balHudElement.setText("");
        }
    }

    initVariables() {
        this.hudElements = undefined;
        this.guessBalHp = undefined;
        this.balRespawnHud = undefined;
        this.balHudElement = undefined;
        this.balEntity = undefined;
        this.balDespawnDebounce = undefined;
        this.lastBalAlive = undefined;
        this.balHP = undefined;
        this.seenBalDamages = undefined;
        this.armourstandClass = undefined;
        this.balPetAlert = undefined;
    }

    onDisable() {
        this.hudElements.forEach((h) => h.delete());
        this.initVariables();
    }
}


module.exports = {
    class: new Mining
};