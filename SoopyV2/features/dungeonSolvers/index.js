import fetch from "../../../SoopyV2/utils/networkUtils"; import Promise from "../../../PromiseV2";


import Feature from "../../featureClass/class";
import { addNotation, numberWithCommas } from "../../utils/numberUtils";
import *as renderUtils from "../../utils/renderUtils";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import ToggleSetting from "../settings/settingThings/toggle";
import TextSetting from "../settings/settingThings/textSetting";
import { delay } from "../../utils/delayUtils";
import { Points, Waypoint } from "../../utils/renderJavaUtils";
import { calculateDistanceQuick, getLore } from "../../utils/utils";
import { drawLinePoints } from "../../utils/renderUtils";

const entityGuardian = Java.type("net.minecraft.entity.monster.EntityGuardian");

const MCBlock = Java.type("net.minecraft.block.Block");
const EntityBlaze = Java.type("net.minecraft.entity.monster.EntityBlaze");
let translate;
try {
    translate = net.minecraft.util.StringTranslate.func_74808_a();
} catch (e) {

}
let wrongColorList = {
    "light grey": "silver",
    "wool": "white wool",
    "ink": "black ink",
    "lapis": "blue lapis",
    "cocoa": "brown cocoa"
};


class DungeonSolvers extends Feature {
    constructor() {
        super();
    }

    isInDungeon() {
        return this.FeatureManager.features["dataLoader"].class.isInDungeon;
    }

    onEnable() {
        this.initVariables();

        this.lividData = {};
        this.lividData.lividColor = {
            Vendetta: "&f",
            Crossed: "&d",
            Hockey: "&c",
            Doctor: "&7",
            Frog: "&2",
            Smile: "&a",
            Scream: "&9",
            Purple: "&5",
            Arcade: "&e"
        };


        this.iceSprayEntityPH = undefined;
        this.bonzoMaskTimer = 0;
        this.fraggedBonzoMaskTimer = 0;
        this.spiritMaskTimer = 0;
        this.eraseBonzoTimer = true;
        this.bonzoMaskCooldown = 0;

        this.lastWorldload = Date.now();
        this.lividFindEnabled = new ToggleSetting("Correct livid finder", "Finds the real livid to kill in the f5 boss fight", true, "livid_find_enabled", this);
        this.lividFindHud = new ToggleSetting("Show Livid Hp", "Shows the nametag of the correct livid", true, "livid_hud_enabled", this).requires(this.lividFindEnabled);
        this.lividHpElement = new HudTextElement().setToggleSetting(this.lividFindHud).setLocationSetting(new LocationSetting("Correct Livid Hp Location", "Allows you to edit the location of the correct livid hp text", "livid_hp_location", this, [10, 50, 1, 1]).requires(this.lividFindHud).editTempText("\xA7r\xA7e\uFD3E \xA7c\xA7lLivid\xA7r \xA7a7M\xA7c\u2764 \xA7e\uFD3F\xA7r"));

        this.hudElements.push(this.lividHpElement);

        this.lividFindBox = new ToggleSetting("Put a box around the correct livid", "This helps to locate it in the group", true, "livid_box_enabled", this).requires(this.lividFindEnabled);
        this.lividFindNametags = new ToggleSetting("Hide the nametags of incorrect livids", "This helps to locate it in the group", true, "livid_nametags_enabled", this).requires(this.lividFindEnabled);

        this.spiritBowDestroyTimer = new ToggleSetting("Timer for when the spirit bow will self destruct", "", true, "spirit_bow_destroy_timer", this);
        this.spiritBowDestroyElement = new HudTextElement().setToggleSetting(this.spiritBowDestroyTimer).setLocationSetting(new LocationSetting("Spirit bow destroy timer location", "Allows you to edit the location of the timer", "spirit_destroy_location", this, [10, 70, 3, 1]).requires(this.spiritBowDestroyTimer).editTempText("&dBow Destroyed in: &c15s"));

        this.spiritBearSpawnTimer = new ToggleSetting("Timer for when the spirit bear will spawn", "", true, "spirit_bear_spawn_timer", this);
        this.spiritBearSpawnElement = new HudTextElement().setToggleSetting(this.spiritBearSpawnTimer).setLocationSetting(new LocationSetting("Spirit bear spawn timer location", "Allows you to edit the location of the timer", "spirit_bear_spawn_location", this, [10, 70, 3, 1]).requires(this.spiritBearSpawnTimer).editTempText("&dBear spawned in: &c1.57s"));

        this.fireFreezeTimer = new ToggleSetting("Timer for when to fire freeze in m3/f3", "", true, "ff_timer", this);
        this.fireFreezeTimerElement = new HudTextElement().setToggleSetting(this.fireFreezeTimer).setLocationSetting(new LocationSetting("Fire freeze timer location", "Allows you to edit the location of the timer", "fire_freeze_location", this, [10, 80, 3, 1]).requires(this.fireFreezeTimer).editTempText("&dFire freeze in: &c1.57s"));

        this.hudElements.push(this.spiritBearSpawnElement);
        this.hudElements.push(this.fireFreezeTimerElement);
        this.hudElements.push(this.spiritBowDestroyElement);

        this.bloodCampAssist = new ToggleSetting("Assist blood camp", "Helps guess where and when blood mobs will spawn", true, "blood_camp_assist", this);

        this.runSpeedRates = new ToggleSetting("Show run speed and exp rates", "(Run speed includes downtime inbetween runs, only shows while doing dungeon runs)", true, "run_speed_rates", this);
        this.runSpeedRatesElement = new HudTextElement().
            setText("&6Run speed&7> &fLoading...\n&6Exp/hour&7> &fLoading...\n&6Runs/hour&7> &fLoading...").
            setToggleSetting(this.runSpeedRates).
            setLocationSetting(new LocationSetting("Run speed and exp rates location", "Allows you to edit the location of the information", "run_speed_rates_location", this, [10, 100, 1, 1]).requires(this.runSpeedRates).editTempText("&6Run speed&7> &f4:30\n&6Exp/hour&7> &f1,234,567\n&6Runs/hour&7> &f17"));

        this.scoreCalculation = new ToggleSetting("Show score calculation", "", true, "run_score_calc", this);
        this.scoreElement = new HudTextElement().setToggleSetting(this.scoreCalculation).setLocationSetting(new LocationSetting("Score calculation location", "Allows you to edit the location of the score calc", "score_calc_location", this, [10, 130, 1, 1]).requires(this.scoreCalculation).editTempText("&dScore: 120\n&aS+ ??\n&aS  ??"));

        this.hudElements.push(this.runSpeedRatesElement);
        this.hudElements.push(this.scoreElement);

        this.blazeSolver = new ToggleSetting("Blaze Puzzle Solver", "Shows what order to kill the blazes in", true, "blaze_solver", this);
        this.respawnTimerTerra = new ToggleSetting("Terracotter respawn timer", "", true, "f6_timer_thing", this);

        this.lastDungFinishes = [];
        this.lastDungExps = [];
        this.registerChat("${start}+&r&3${exp} Catacombs Experience&r", (start, exp) => {
            if (ChatLib.removeFormatting(start).replace(/ /gi, "").length > 0) return;
            this.lastDungExps.push(parseFloat(exp.replace(/,/gi, "")));
            if (this.lastDungExps.length > 5) {
                this.lastDungExps.shift();
            }

            this.lastDungFinishes.push(Date.now());
            if (this.lastDungFinishes.length > 5) {
                this.lastDungFinishes.shift();
            }

            this.bonzoMaskTimer = 0;
            this.fraggedBonzoMaskTimer = 0;
            this.spiritMaskTimer = 0;
            this.eraseBonzoTimer = true;
        });
        this.registerStep(false, 30, this.getBonzoMaskCooldown);
        this.bonzoSpiritMaskTimer = new ToggleSetting("Timer for when bonzo/spirit mask will be ready", "works for both bonzo masks, hides bonzo masks' timers after you leave the run", false, "bonzo_mask_timer", this);
        this.bonzoSpiritMaskTimerElement = new HudTextElement().setToggleSetting(this.bonzoSpiritMaskTimer).setLocationSetting(new LocationSetting("Bonzo/Spirit Mask timer location", "Allows you to edit the location of the timer", "bonzo_mask_timer_location", this, [10, 100, 1, 1]).requires(this.bonzoSpiritMaskTimer).editTempText("&9Bonzo's Mask: &c157s"));
        this.hudElements.push(this.bonzoSpiritMaskTimerElement);
        this.spiritMaskOutsideDungeon = new ToggleSetting("Spirit Mask Timer Outside Dungeons", "should spirit mask timer be shown outside dungeon?", false, "spirit_mask_timer", this).requires(this.bonzoSpiritMaskTimer);

        this.normalBonzoMask = new ToggleSetting("Bonzo Mask Proc'ed Alert", "Enable this to change the message", true, "bonzo_mask_alert", this).requires(this.bonzoSpiritMaskTimer);
        this.normalBonzoMaskMessage = new TextSetting("Bonzo Mask Proc'ed Message", "change bonzo mask proc message here", "&cBonzo Mask Used", "bonzo_mask_alert_message", this, "&cBonzo Mask Used", false).requires(this.normalBonzoMask);
        this.fraggedBonzoMask = new ToggleSetting("\u269A Bonzo Mask Proc'ed Alert", "Enable this to change the message", true, "fragged_bonzo_mask_alert", this).requires(this.bonzoSpiritMaskTimer);
        this.fraggedBonzoMaskMessage = new TextSetting("\u269A Bonzo Mask Proc'ed Message", "change bonzo mask proc message here", "&c\u269A Bonzo Mask Used", "fragged_bonzo_mask_alert_message", this, "&c\u269A Bonzo Mask Used", false).requires(this.fraggedBonzoMask);
        this.spiritMask = new ToggleSetting("Spirit Mask Proc'ed Alert", "Enable this to change the message", true, "spirit_mask_alert", this).requires(this.bonzoSpiritMaskTimer);
        this.spiritMaskMessage = new TextSetting("Spirit Mask Proc'ed Message", "change spirit mask proc message here", "&cSpirit Mask Used", "spirit_mask_alert_message", this, "&cSpirit Mask Used", false).requires(this.spiritMask);

        this.registerChat("&r&aYour &r&9Bonzo's Mask &r&asaved your life!&r", () => {
            this.eraseBonzoTimer = false;
            if (this.bonzoSpiritMaskTimer.getValue()) {
                this.bonzoMaskTimer = Date.now() + this.bonzoMaskCooldown * 1000;
            }
            if (this.normalBonzoMask.getValue()) {
                let m = this.normalBonzoMaskMessage.getValue();
                Client.showTitle(m ? m : "&cBonzo Mask Used", "", 0, 60, 10);
            }
        });

        this.registerChat("&r&aYour &r&9\u269A Bonzo's Mask &r&asaved your life!&r", () => {
            this.eraseBonzoTimer = false;
            if (this.bonzoSpiritMaskTimer.getValue()) {
                this.fraggedBonzoMaskTimer = Date.now() + this.bonzoMaskCooldown * 1000;
            }
            if (this.fraggedBonzoMask.getValue()) {
                let m = this.fraggedBonzoMaskMessage.getValue();
                Client.showTitle(m ? m : "&c\u269A Bonzo Mask Used", "", 0, 60, 10);
            }
        });

        this.registerChat("&r&6Second Wind Activated&r&a! &r&aYour Spirit Mask saved your life!&r", () => {
            if (this.bonzoSpiritMaskTimer.getValue()) {
                if (this.spiritMaskOutsideDungeon.getValue() ? true : !this.eraseBonzoTimer) {
                    this.spiritMaskTimer = Date.now() + 30 * 1000;
                }
            }
            if (this.fraggedBonzoMask.getValue()) {
                let m = this.spiritMaskMessage.getValue();
                Client.showTitle(m ? m : "&cSpirit Mask Used", "", 0, 60, 10);
            }
        });

        this.registerStep(true, 10, () => {
            if (!this.bonzoSpiritMaskTimer.getValue()) return;
            let timerText = "";
            if (this.spiritMaskOutsideDungeon.getValue() ? true : !this.eraseBonzoTimer) {
                if (this.spiritMask.getValue()) {
                    let timer1 = Math.round((this.spiritMaskTimer - Date.now()) / 100) / 10;
                    timerText += "&5Spirit Mask: " + (timer1 > 0 ? "&c" + timer1 + "&6s" : "&6READY") + "\n";
                }
            }
            if (!this.eraseBonzoTimer) {
                if (this.normalBonzoMask.getValue()) {
                    let timer2 = Math.round((this.bonzoMaskTimer - Date.now()) / 100) / 10;
                    timerText += "&9Bonzo's Mask: " + (timer2 > 0 ? "&c" + timer2 + "&6s" : "&6READY") + "\n";
                }
                if (this.fraggedBonzoMask.getValue()) {
                    let timer3 = Math.round((this.fraggedBonzoMaskTimer - Date.now()) / 100) / 10;
                    timerText += "&9\u269A Bonzo's Mask: " + (timer3 > 0 ? "&c" + timer3 + "&6s" : "&6READY");
                }
            }
            this.bonzoSpiritMaskTimerElement.setText(timerText);
        });
        this.forgorEnabled = new ToggleSetting("Change withermancer death message to forgor ", "", true, "withermancer_forgor", this);
        this.f7waypoints = new ToggleSetting("Waypoints for P3 F7/M7", "(Only shows unfinished ones)", true, "f7_waypoints", this);
        this.f7waypointschat = new ToggleSetting("Show how many terms/devices people did", "At end of p3", true, "f7_waypoints_chat", this);

        this.IceSprayWarn = new ToggleSetting("Ice Spray Drop Ping", "Renders a big title so you don't miss ice spray wands", false, "ice_spray_ping", this).contributor("EmeraldMerchant");

        this.guardianHp = new ToggleSetting("m3/f3 guardian hp", "", true, "guardian_hp", this);

        this.stairStonkHelper = new ToggleSetting("Stair Stonk Helper", "shows a line where to drop thru", true, "stair_stonk_helper", this);

        this.registerChat("&r&c \u2620 &r${player} were killed by Withermancer&r&7 and became a ghost&r&7.&r", (player, e) => {
            if (this.forgorEnabled.getValue()) {
                cancel(e);
                ChatLib.chat(player + " forgor \u2620");
            }
        });
        this.registerChat("&r&c \u2620 &r${player} was killed by Withermancer&r&7 and became a ghost&r&7.&r", (player, e) => {
            if (this.forgorEnabled.getValue()) {
                cancel(e);
                ChatLib.chat(player + " forgor \u2620");
            }
        });

        this.registerChat("&r&c \u2620 ${info} and became a ghost&r&7.&r", (info, e) => {
            let player = ChatLib.removeFormatting(info.split(" ")[0]);

            this.scanFirstDeathForSpiritPet(player);
        });

        this.spiritBowPickUps = [];
        this.registerChat("&r&aYou picked up the &r&5Spirit Bow&r&a! Use it to attack &r&cThorn&r&a!&r", () => {
            this.spiritBowPickUps.push(Date.now());
        });

        this.bearSpawning = 0;
        this.registerChat("&r&a&lThe &r&5&lSpirit Bow &r&a&lhas dropped!&r", () => {
            this.bearSpawning = -Date.now();
        });

        this.todoE = [];
        this.eMovingThing = {};
        this.nameToUuid = {
            "you": Player.getUUID().toString()
        };

        this.bloodX = -1;
        this.bloodY = -1;
        this.startSpawningTime = 0;
        this.spawnIdThing = 0;

        this.failedPuzzleCount = 0;
        this.totalPuzzleCount = 0;
        this.completedPuzzleCount = 0;

        this.ezpz = false;

        this.arrows = [];
        this.blazes = [];
        this.blazeX = -1;
        this.blazeY = -1;
        this.timersData = [];

        this.dungeonSecretRquired = {
            1: 0.3,
            2: 0.4,
            3: 0.5,
            4: 0.6,
            5: 0.7,
            6: 0.85,
            7: 1
        };

        this.floorSecondMod = {
            1: 120,
            2: 120,
            3: 120,
            4: 120,
            5: 240,
            6: 120,
            7: 360
        };

        this.renderEntityEvent = this.registerEvent("renderEntity", this.renderEntity);

        this.registerStep(true, 2, this.stepNotDung).registeredWhen(() => !this.isInDungeon());
        this.registerStep(true, 2, this.step).registeredWhen(() => this.isInDungeon());
        this.registerStep(false, 60, this.step);
        this.registerStep(true, 10, this.step2).registeredWhen(() => this.isInDungeon());
        this.registerStep(true, 1, this.step_1fps).registeredWhen(() => this.isInDungeon());
        this.registerStep(false, 60 * 5, this.step_5min);
        this.registerEvent("worldLoad", this.onWorldLoad);

        this.registerEvent("renderWorld", this.renderWorld).registeredWhen(() => this.isInDungeon());

        this.bloodOpenedBonus = false;
        this.goneInBonus = false;
        this.mimicDead = false;
        this.inBoss = false;
        this.registerChat("&r&cThe &r&c&lBLOOD DOOR&r&c has been opened!&r", () => {
            this.bloodOpenedBonus = true;
            this.goneInBonus = true;
        });
        this.registerChat("[BOSS] The Watcher: You have proven yourself. You may pass.", () => {
            delay(5000, () => {
                this.bloodOpenedBonus = false;
                this.goneInBonus = true;
            });
        });
        let enteredBossMessages = ["[BOSS] Maxor: WELL WELL WELL LOOK WHO\u2019S HERE!", "[BOSS] Livid: Welcome, you arrive right on time. I am Livid, the Master of Shadows.", "[BOSS] Thorn: Welcome Adventurers! I am Thorn, the Spirit! And host of the Vegan Trials!", "[BOSS] The Professor: I was burdened with terrible news recently...", "[BOSS] Scarf: This is where the journey ends for you, Adventurers.", "[BOSS] Bonzo: Gratz for making it this far, but I\u2019m basically unbeatable.", "[BOSS] Sadan: So you made it all the way here...and you wish to defy me? Sadan?!"];
        enteredBossMessages.forEach((msg) => {
            this.registerChat(msg, () => {
                this.goneInBonus = false;
                this.bloodOpenedBonus = false;
                this.inBoss = true;
            });
        });
        this.registerEvent("entityDeath", (entity) => {
            if (entity.getClassName() === "EntityZombie") {
                if (entity.getEntity().func_70631_g_()) {
                    if (entity.getEntity().func_82169_q(0) === null && entity.getEntity().func_82169_q(1) === null && entity.getEntity().func_82169_q(2) === null && entity.getEntity().func_82169_q(3) === null) {
                        this.mimicDead = true;
                    }
                }
            }
        });
        let mimicDeadMessages = ["$SKYTILS-DUNGEON-SCORE-MIMIC$", "Mimic Killed!", "Mimic Dead!", "Mimic dead!"];
        this.registerChat("&r&9Party &8> ${msg}", (msg) => {
            mimicDeadMessages.forEach((dmsg) => {
                if (msg.includes(dmsg)) this.mimicDead = true;
            });
        });

        this.registerChat("&r&aDungeon starts in 1 second.&r", () => {
            this.goneInBonus = false;
            this.bloodOpenedBonus = false;

            this.firstDeath = false;
            this.firstDeathHadSpirit = false;
        });

        this.registerChat("&r&aDungeon starts in 1 second. Get ready!&r", () => {
            this.goneInBonus = false;
            this.bloodOpenedBonus = false;

            this.firstDeath = false;
            this.firstDeathHadSpirit = false;
        });

        this.firstDeath = false;
        this.firstDeathHadSpirit = false;


        this.registerForge(net.minecraftforge.event.entity.EntityJoinWorldEvent, this.entityJoinWorldEvent).registeredWhen(() => this.isInDungeon() && !this.inBoss);


        this.onWorldLoad();

        this.registerEvent("tick", () => {
            this.terminals.forEach((w) => w.update());
            this.levers.forEach((w) => w.update());
            this.devices.forEach((w) => w.update());
        }).registeredWhen(() => this.f7waypoints.getValue());
        this.terminals = [];
        this.levers = [];
        this.devices = [];
        this.data = [];
        this.area = -1;
        this.termsDone = new Map;
        let deviceDone = false;
        this.registerChat("[BOSS] Goldor: You have done it, you destroyed the factory\u2026", () => {
            this.area = -1;
            deviceDone = false;
            this.areaUpdated();
        });
        this.registerEvent("worldLoad", () => {
            if (this.area !== -1) {
                this.area = -1;
                this.areaUpdated();
            }
        });
        this.registerChat("[BOSS] Goldor: Who dares trespass into my domain?", () => {
            this.area = 0;
            this.termsDone.clear();
            deviceDone = false;
            this.areaUpdated();
        });

        this.loadf7data();

        this.ffCountdownTo = 0;
        this.registerChat("[BOSS] The Professor: Oh? You found my Guardians' one weakness?", () => {
            this.ffCountdownTo = Date.now() + 5000;

            delay(5000, () => {
                this.ffCountdownTo = 0;
            });
        });

        this.registerChat("${name} activated a lever! (${start}/${end})", (name, start, end) => {
            if (name.includes(">")) return;
            if (this.area === -1) {
                this.area = 0;
                this.termsDone.clear();
                this.areaUpdated();
                deviceDone = false;
            }

            let player = World.getPlayerByName(ChatLib.removeFormatting(name));

            let data = this.termsDone.get(name) || {
                terms: 0,
                devices: 0,
                levers: 0
            };

            data.levers++;
            this.termsDone.set(name, data);

            if (!player) return;

            let closestDist = calculateDistanceQuick([this.levers[0].params.x, this.levers[0].params.y, this.levers[0].params.z], [player.getX(), player.getY(), player.getZ()]);
            let closest = this.levers[0];
            this.levers.forEach((l) => {
                if (!l.rendering) return;
                let dist = calculateDistanceQuick([l.params.x, l.params.y, l.params.z], [player.getX(), player.getY(), player.getZ()]);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = l;
                }
            });
            closest.stopRender();


            if (start == "0" || start == end) {
                this.area++;
                deviceDone = false;
                this.areaUpdated();
            }
        }).registeredWhen(() => this.f7waypoints.getValue());

        this.registerChat("${name} completed a device! (${start}/${end})", (name, start, end) => {
            if (name.includes(">")) return;
            if (this.area === -1) {
                this.area = 0;
                this.termsDone.clear();
                this.areaUpdated();
                deviceDone = false;
            }

            let data = this.termsDone.get(name) || {
                terms: 0,
                devices: 0,
                levers: 0
            };

            if (!deviceDone) data.devices++;
            this.termsDone.set(name, data);
            deviceDone = true;

            let closest = this.devices[0];

            closest.stopRender();

            if (start == "0" || start == end) {
                this.area++;
                deviceDone = false;
                this.areaUpdated();
            }
        }).registeredWhen(() => this.f7waypoints.getValue());

        this.registerChat("${name} activated a terminal! (${start}/${end})", (name, start, end) => {
            if (name.includes(">")) return;
            if (this.area === -1) {
                this.area = 0;
                this.termsDone.clear();
                deviceDone = false;
                this.areaUpdated();
            }
            let player = World.getPlayerByName(ChatLib.removeFormatting(name));

            let data = this.termsDone.get(name) || {
                terms: 0,
                devices: 0,
                levers: 0
            };

            data.terms++;
            this.termsDone.set(name, data);

            if (!player) return;

            let closestDist = calculateDistanceQuick([this.terminals[0].params.x, this.terminals[0].params.y, this.terminals[0].params.z], [player.getX(), player.getY(), player.getZ()]);
            let closest = this.terminals[0];
            this.terminals.forEach((l) => {
                if (!l.rendering) return;
                let dist = calculateDistanceQuick([l.params.x, l.params.y, l.params.z], [player.getX(), player.getY(), player.getZ()]);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = l;
                }
            });
            closest.stopRender();


            if (start == "0" || start == end) {
                this.area++;
                deviceDone = false;
                this.areaUpdated();
            }
        }).registeredWhen(() => this.f7waypoints.getValue());




        this.inf6boss = false;
        this.registerStep(true, 1, () => {
            this.inf6boss = this.getCurrentRoomId() === "sadan";
        });

        let packetRecieved = this.registerCustom("packetReceived", this.packetReceived).registeredWhen(() => this.inf6boss && this.respawnTimerTerra.getValue());

        try {
            packetRecieved.trigger.setPacketClasses([net.minecraft.network.play.server.S23PacketBlockChange, net.minecraft.network.play.server.S22PacketMultiBlockChange]);
        } catch (e) { }

        let blockLineThings = [];
        let addedBlockLineThings = new Set;

        this.registerEvent("worldUnload", () => {
            blockLineThings.forEach((b) => b.stopRender());
            blockLineThings = [];
            addedBlockLineThings.clear();
        });
        this.registerEvent("blockBreak", (b) => {
            if (!this.stairStonkHelper.getValue()) return;

            let block = b;

            if (!block.getType().getRegistryName().endsWith("_stairs")) return;

            if (addedBlockLineThings.has(`${block.getX()},${block.getY()},${block.getZ()}`)) return;
            addedBlockLineThings.add(`${block.getX()},${block.getY()},${block.getZ()}`);

            let dir = block.getMetadata();

            let locs = [];
            switch (dir) {
                case 0:
                    locs = [
                        [block.getX() + 0.24, block.getY() + 1.1, block.getZ()],
                        [block.getX() + 0.24, block.getY() + 1.1, block.getZ() + 1]];

                    break;
                case 1:
                    locs = [
                        [block.getX() + 0.76, block.getY() + 1.1, block.getZ()],
                        [block.getX() + 0.76, block.getY() + 1.1, block.getZ() + 1]];

                    break;
                case 2:
                    locs = [
                        [block.getX(), block.getY() + 1.1, block.getZ() + 0.24],
                        [block.getX() + 1, block.getY() + 1.1, block.getZ() + 0.24]];

                    break;
                case 3:
                    locs = [
                        [block.getX(), block.getY() + 1.1, block.getZ() + 0.76],
                        [block.getX() + 1, block.getY() + 1.1, block.getZ() + 0.76]];

                    break;
            }

            blockLineThings.push(new Points(locs, 255, 0, 0, 255, 1, true).startRender());





        });
    }
    getBonzoMaskCooldown() {
        if (!Player.getInventory()) return;
        [...Player.getInventory().getItems()].forEach((i) => {
            if (!i) return;
            let itemName = i.getName();
            if (itemName.removeFormatting().includes("Bonzo's Mask")) {
                getLore(i).forEach((line) => {
                    if (line.includes("Cooldown:")) {
                        this.bonzoMaskCooldown = Number(line.removeFormatting().split("n: ")[1].replace("s", ""));
                    }
                });
            }
        });
    }
    getCurrentRoomId() {
        if (Scoreboard.getLines().length === 0) return;
        let id = ChatLib.removeFormatting(Scoreboard.getLineByIndex(Scoreboard.getLines().length - 1).getName()).trim().split(" ").pop();

        return id;
    }
    getBlockIdFromState(state) {
        return MCBlock["func_176210_f"](state);
    }

    packetReceived(packet, event) {
        if (!this.inf6boss || !this.respawnTimerTerra.getValue()) return;

        let packetType = new String(packet.class.getSimpleName()).valueOf();
        if (packetType === "S23PacketBlockChange") {
            let position = new BlockPos(packet["func_179827_b"]());
            let blockState = this.getBlockIdFromState(packet["func_180728_a"]());
            let oldBlockState = this.getBlockIdFromState(World.getBlockStateAt(position));

            if (oldBlockState === 0 && blockState === 4240 && this.inf6boss) {
                this.timerThing(position);
            }
        }
        if (packetType === "S22PacketMultiBlockChange") {
            packet["func_179844_a"]().forEach((b) => {
                let position = new BlockPos(b["func_180090_a"]());
                let blockState = this.getBlockIdFromState(b["func_180088_c"]());
                let oldBlockState = this.getBlockIdFromState(World.getBlockStateAt(position));

                if (oldBlockState === 0 && blockState === 4240 && this.inf6boss) {
                    this.timerThing(position);
                }
            });
        }
    }

    timerThing(position) {
        this.timersData.push([position, Date.now() + (this.FeatureManager.features["dataLoader"].class.dungeonFloor[0] === "M" ? 3500 : 5000)]);
    }

    areaUpdated() {
        if (this.f7waypointschat.getValue() && this.terminals.length > 0 && (this.area === -1 || this.area === 4)) {
            delay(1000, () => {
                this.termsDone.forEach((data, name) => {
                    ChatLib.chat(this.FeatureManager.messagePrefix + name + " &7completed &f" + data.terms + "&7 terms, &f" + data.devices + "&7 devices, and &f" + data.levers + " &7levers!");
                });
            });
        }

        this.terminals.forEach((w) => w.stopRender());
        this.levers.forEach((w) => w.stopRender());
        this.devices.forEach((w) => w.stopRender());

        this.terminals = [];
        this.levers = [];
        this.devices = [];

        if (!this.f7waypoints.getValue()) return;

        this.data.forEach((term) => {
            if (term.phase !== this.area) return;

            if (term.type === "lever") {
                this.levers.push(new Waypoint(term.location[0], term.location[1], term.location[2], 1, 0, 0, { name: "Lever" }).startRender());
            }
            if (term.type === "terminal") {
                this.terminals.push(new Waypoint(term.location[0], term.location[1], term.location[2], 1, 0, 0, { name: term.name }).startRender());
            }
            if (term.type === "device") {
                this.devices.push(new Waypoint(term.location[0], term.location[1], term.location[2], 1, 0, 0, { name: "Device" }).startRender());
            }
        });
    }

    loadf7data() {
        this.unloadf7data();

        let data = FileLib.read("SoopyV2", "features/dungeonSolvers/f7data.json");
        data = JSON.parse(data);

        this.data = data;
    }

    unloadf7data() {
        this.terminals.forEach((w) => w.stopRender());
        this.levers.forEach((w) => w.stopRender());
        this.devices.forEach((w) => w.stopRender());

        this.terminals = [];
        this.levers = [];
        this.devices = [];
        this.data = [];
        this.area = 0;
    }

    step_5min() {
        this.ezpz = false;
        if (!this.FeatureManager.features["dataLoader"].class.mayorData) return;
        if (this.FeatureManager.features["dataLoader"].class.mayorData.mayor.name === "Paul") {
            if (this.FeatureManager.features["dataLoader"].class.currentMayorPerks.has("EZPZ")) {
                this.ezpz = true;
            }
        }
    }

    calculateDungeonScore() {
        if (!this.FeatureManager.features["dataLoader"].class.dungeonFloor) {
            this.scoreElement.setText("");
            return;
        }

        if (!this.FeatureManager.features["dataLoader"].class.stats.Deaths) return;


        let deaths = parseInt(this.FeatureManager.features["dataLoader"].class.stats.Deaths.replace("(", "").replace(")", ""));

        let seconds = 0;
        if (this.FeatureManager.features["dataLoader"].class.stats.Time !== "Soon!") {
            let data = this.FeatureManager.features["dataLoader"].class.stats.Time.split(" ");
            seconds += parseInt(data.pop() || 0);
            seconds += parseInt(data.pop() || 0) * 60;
            seconds += parseInt(data.pop() || 0) * 60 * 60;
        }
        let timeLimit = this.FeatureManager.features["dataLoader"].class.dungeonFloor[0] === "M" ? 480 : this.floorSecondMod[this.FeatureManager.features["dataLoader"].class.dungeonFloor[1]];
        let inDungeonSeconds = seconds - timeLimit;

        let clearedPercent = this.FeatureManager.features["dataLoader"].class.dungeonPercentCleared;

        let dungeonFloor = this.FeatureManager.features["dataLoader"].class.dungeonFloor[1];

        let secretPercentRequired = this.FeatureManager.features["dataLoader"].class.dungeonFloor[0] === "M" ? 1 : this.dungeonSecretRquired[dungeonFloor];

        let clearedRooms = parseInt(this.FeatureManager.features["dataLoader"].class.stats["Completed Rooms"]);

        let totalRooms = clearedRooms / clearedPercent || 25;

        let currentSecretsFound = parseInt(this.FeatureManager.features["dataLoader"].class.stats["Secrets Found"]);
        let currentSecretPercent = parseFloat(this.FeatureManager.features["dataLoader"].class.stats["Secrets Found%"].replace("%", "")) / 100;

        let crypts = parseInt(this.FeatureManager.features["dataLoader"].class.stats["Crypts"]);

        let maxSecrets = currentSecretsFound / currentSecretPercent || 50;


        let skillScore = Math.floor(Math.max(20, 20 - (this.totalPuzzleCount - this.completedPuzzleCount) * 10 + (80 * (clearedRooms + this.bloodOpenedBonus + this.goneInBonus) / totalRooms - deaths * 2 + this.firstDeathHadSpirit)));
        let exploreScore = Math.floor(60 * (clearedRooms + this.bloodOpenedBonus + this.goneInBonus) / totalRooms) + Math.floor(Math.min(40, 40 * currentSecretsFound / secretPercentRequired / maxSecrets));
        let speedScore;
        if (inDungeonSeconds < 480) {
            speedScore = 100;
        } else if (inDungeonSeconds < 600) {
            speedScore = Math.ceil(140 - inDungeonSeconds / 12);
        } else if (inDungeonSeconds < 840) {
            speedScore = Math.ceil(115 - inDungeonSeconds / 24);
        } else if (inDungeonSeconds < 1140) {
            speedScore = Math.ceil(108 - inDungeonSeconds / 30);
        } else if (inDungeonSeconds < 3940) {
            speedScore = Math.ceil(98.5 - inDungeonSeconds / 40);
        } else {
            speedScore = 0;
        }
        let bonus = Math.min(5, crypts) + this.mimicDead * 2 + this.ezpz * 10;



        let hypotheticalSkillScore = Math.floor(Math.max(20, 20 - this.failedPuzzleCount * 10 + 80 - deaths * 2 + this.firstDeathHadSpirit));
        let hypotheticalSpeedScore = speedScore;


        let hypotheticalBonusScoreS = Math.min(5, crypts) + this.mimicDead * 2 + this.ezpz * 10;

        let sNeededSecrets = Math.min(maxSecrets * secretPercentRequired, Math.ceil((270 - hypotheticalSkillScore - hypotheticalBonusScoreS - hypotheticalSpeedScore - 60) * maxSecrets * secretPercentRequired / 40));

        sNeededSecrets = Math.max(currentSecretsFound, sNeededSecrets);

        let hypotheticalScoreGottenS = hypotheticalSkillScore + hypotheticalSpeedScore + hypotheticalBonusScoreS + 60 + Math.floor(Math.min(40, 40 * sNeededSecrets / secretPercentRequired / maxSecrets));
        let sCryptsNeeded = Math.max(crypts, Math.min(5, 270 - hypotheticalScoreGottenS));
        hypotheticalScoreGottenS -= hypotheticalBonusScoreS;
        hypotheticalBonusScoreS = sCryptsNeeded + this.mimicDead * 2 + this.ezpz * 10;
        hypotheticalScoreGottenS += hypotheticalBonusScoreS;

        let sPossible = hypotheticalScoreGottenS >= 270;


        let hypotheticalBonusScoreSplus = 5 + this.mimicDead * 2 + this.ezpz * 10;

        let splusNeededSecrets = Math.ceil((300 - hypotheticalSkillScore - hypotheticalBonusScoreSplus - hypotheticalSpeedScore - 60) * maxSecrets * secretPercentRequired / 40);

        let splusPossible = splusNeededSecrets <= maxSecrets * secretPercentRequired;

        splusNeededSecrets = Math.max(currentSecretsFound, splusNeededSecrets);

        let hypotheticalScoreGottenSPlus = hypotheticalSkillScore + hypotheticalSpeedScore + hypotheticalBonusScoreSplus + 60 + Math.floor(Math.min(40, 40 * splusNeededSecrets / secretPercentRequired / maxSecrets));
        let splusCryptsNeeded = Math.max(crypts, 5 - (hypotheticalScoreGottenSPlus - 300));
        hypotheticalScoreGottenSPlus -= hypotheticalBonusScoreSplus;
        hypotheticalBonusScoreSplus = splusCryptsNeeded + this.mimicDead * 2 + this.ezpz * 10;
        hypotheticalScoreGottenSPlus += hypotheticalBonusScoreSplus;


        let sPlusText = currentSecretsFound === 0 ? "??" : skillScore + exploreScore + speedScore + bonus >= 300 ? "\u2714" : splusPossible ? `(${hypotheticalScoreGottenSPlus}): ${currentSecretsFound}/${splusNeededSecrets} +${crypts}c/${splusCryptsNeeded}` : "\u2716";
        let sText = currentSecretsFound === 0 ? "  ??" : skillScore + exploreScore + speedScore + bonus >= 270 ? "  \u2714" : sPossible ? `  (${hypotheticalScoreGottenS}): ${currentSecretsFound}/${sNeededSecrets} +${crypts}c/${sCryptsNeeded}` : "\u2716";

        this.scoreElement.setText(`&dScore: ${skillScore + exploreScore + speedScore + bonus}\n&aS+ ${sPlusText}\n&aS ${sText}`);
    }

    scanFirstDeathForSpiritPet(username) {
        var _test, _test2; return Promise.resolve().then(() => {
            return (() => {
                if (!this.firstDeath) {
                    return (() => {
                        this.firstDeath = true; return (() => {
                            if (!!this.nameToUuid[username.toLowerCase()]) {
                                return Promise.resolve().then(() => {
                                    let uuid = this.nameToUuid[username.toLowerCase()]?.replace(/-/g, ""); _test =

                                        this.FeatureManager.features["globalSettings"] && this.FeatureManager.features["globalSettings"].class.apiKeySetting.getValue(); return (() => {
                                            if (_test) {
                                                return Promise.resolve().then(() => {
                                                    return (
                                                        fetch(`https://api.hypixel.net/skyblock/profiles?key=${this.FeatureManager.features["globalSettings"].class.apiKeySetting.getValue()}&uuid=${uuid}`).json())
                                                }).then((_resp) => { let data = _resp })
                                            }
                                        })()
                                }).then(() => {
                                    return (() => {
                                        if (!(_test && !data.success)) {
                                            return (() => {
                                                if (_test) {

                                                    let latestProfile = undefined;

                                                    data.profiles.forEach((p) => {
                                                        if (p.selected) {
                                                            latestProfile = p.members[uuid].pets.some((pet) => pet.type === "SPIRIT" && pet.tier === "LEGENDARY");
                                                        }
                                                    })
                                                } _test2 = _test &&

                                                    latestProfile; if (_test2) {
                                                        this.firstDeathHadSpirit = true
                                                    } return (() => {
                                                        if (_test2 && this.scoreCalculation.getValue()) { ChatLib.chat(this.FeatureManager.messagePrefix + username + " has spirit pet!") } else {
                                                            return Promise.resolve().then(() => {
                                                                if (_test) {
                                                                    if (this.scoreCalculation.getValue()) { ChatLib.chat(this.FeatureManager.messagePrefix + username + " does not have spirit pet!") }
                                                                } return (

                                                                    fetch(`https://soopy.dev/api/v2/player_skyblock/${uuid}`).json())
                                                            }).then((_resp) => {
                                                                let data = _resp;
                                                                if (!!data.success) {

                                                                    if (data.data.profiles[data2.data.stats.currentProfileId].members[uuid].pets.some((pet) => pet.type === "SPIRIT" && pet.tier === "LEGENDARY")) {
                                                                        this.firstDeathHadSpirit = true;
                                                                        if (this.scoreCalculation.getValue()) { ChatLib.chat(this.FeatureManager.messagePrefix + username + " has spirit pet!") }
                                                                    } else {
                                                                        if (this.scoreCalculation.getValue()) { ChatLib.chat(this.FeatureManager.messagePrefix + username + " does not have spirit pet!") }
                                                                    }
                                                                }
                                                            })
                                                        }
                                                    })()
                                            })()
                                        }
                                    })()
                                })
                            }
                        })()
                    })()
                }
            })()
        }).then(() => { })
    }



    entityJoinWorldEvent(event) {
        if (this.bloodCampAssist.getValue()) this.todoE.push(event.entity);




        if (event.entity instanceof EntityBlaze) {

            this.addBlaze(new Entity(event.entity));
        }
    }

    renderWorld(ticks) {
        if (this.lividFindBox.getValue()) {
            if (this.lividData.correctLividEntity) {
                renderUtils.drawBoxAtEntity(this.lividData.correctLividEntity, 255, 0, 0, 0.75, -2, ticks);
            }
        }

        if (this.bloodCampAssist.getValue() && this.skulls) {
            for (let skull of this.skulls) {
                if (this.eMovingThing[skull.getUUID().toString()] && this.eMovingThing[skull.getUUID().toString()].timeTook) {
                    let skullE = skull.getEntity();
                    let startPoint = [skullE["field_70165_t"], skullE["field_70163_u"], skullE["field_70161_v"]];

                    let xSpeed2 = (startPoint[0] - this.eMovingThing[skull.getUUID().toString()].startX) / this.eMovingThing[skull.getUUID().toString()].timeTook;
                    let ySpeed2 = (startPoint[1] - this.eMovingThing[skull.getUUID().toString()].startY) / this.eMovingThing[skull.getUUID().toString()].timeTook;
                    let zSpeed2 = (startPoint[2] - this.eMovingThing[skull.getUUID().toString()].startZ) / this.eMovingThing[skull.getUUID().toString()].timeTook;

                    let time = (this.spawnIdThing >= 4 ? 2900 : 4850) - this.eMovingThing[skull.getUUID().toString()].timeTook;
                    let endPoint1 = this.eMovingThing[skull.getUUID().toString()].endPoint;
                    let endPoint2 = this.eMovingThing[skull.getUUID().toString()].endPointLast;
                    let endPointUpdated = Math.min(Date.now() - this.eMovingThing[skull.getUUID().toString()].endPointUpdated, 100);
                    if (!endPoint2) return;
                    let ping = this.FeatureManager.features["dataLoader"].class.getPing();
                    let endPoint = [endPoint2[0] + (endPoint1[0] - endPoint2[0]) * endPointUpdated / 100, endPoint2[1] + (endPoint1[1] - endPoint2[1]) * endPointUpdated / 100, endPoint2[2] + (endPoint1[2] - endPoint2[2]) * endPointUpdated / 100];
                    let pingPoint = [startPoint[0] + xSpeed2 * ping, startPoint[1] + ySpeed2 * ping, startPoint[2] + zSpeed2 * ping];

                    renderUtils.drawLineWithDepth(startPoint[0], startPoint[1] + 2, startPoint[2], endPoint[0], endPoint[1] + 2, endPoint[2], 255, 0, 0, 2);

                    if (ping < time) {
                        renderUtils.drawBoxAtBlockNotVisThruWalls(pingPoint[0] - 0.5, pingPoint[1] + 1.5, pingPoint[2] - 0.5, 0, 255, 0);
                        renderUtils.drawBoxAtBlockNotVisThruWalls(endPoint[0] - 0.5, endPoint[1] + 1.5, endPoint[2] - 0.5, 255, 0, 0);
                    } else {
                        renderUtils.drawBoxAtBlockNotVisThruWalls(endPoint[0] - 0.5, endPoint[1] + 1.5, endPoint[2] - 0.5, 0, 0, 255);
                    }




                }
            }
        }

        if (this.blazeX !== -1 && this.blazes.length > 0 && this.blazeSolver.getValue()) {
            renderUtils.drawBoxAtEntity(this.blazes[0], 255, 0, 0, 1, 2, ticks, 2);

            let lastLoc = [this.blazes[0].getX(), this.blazes[0].getY() + 1.5, this.blazes[0].getZ()];

            for (let i = 0, blaze = this.blazes[0]; i < this.blazes.length; i++, blaze = this.blazes[i]) {
                if (i < 3 && i !== 0) {
                    renderUtils.drawLineWithDepth(lastLoc[0], lastLoc[1], lastLoc[2], blaze.getX(), blaze.getY() + 1.5, blaze.getZ(), i === 1 ? 0 : 255, i === 1 ? 255 : 0, 0, 3 / i);

                    lastLoc[0] = blaze.getX();
                    lastLoc[1] = blaze.getY() + 1.5;
                    lastLoc[2] = blaze.getZ();
                }
            }
        }

        let shifts = 0;
        for (let data of this.timersData) {
            let [position, time] = data;

            if (Date.now() > time) {
                shifts++;
            }

            Tessellator.drawString(((time - Date.now()) / 1000).toFixed(1) + "s", position.getX(), position.getY() + 0.5, position.getZ(), Renderer.color(0, 255, 50), false, 0.025, false);
        }
        for (let i = 0; i < shifts; i++)this.timersData.shift();

        if (this.guardianHp.getValue() && this.FeatureManager.features["dataLoader"].class.dungeonFloor?.[1] === "3") {
            let es = World.getAllEntitiesOfType(entityGuardian);

            for (let e of es) {
                if (e.getEntity().func_110143_aJ() < 1000) continue;

                Tessellator.drawString(addNotation("oneLetters", Math.round(e.getEntity().func_110143_aJ())), e.getX(), e.getY() + 0.25, e.getZ(), Renderer.color(0, 255, 0), false, 0.1, false);
            }
        }
    }

    renderEntity(entity, position, ticks, event) {
        if (this.lividFindNametags.getValue()) {
            if (this.lividData.correctLividEntity) {
                if (entity.getName().includes("Livid") && entity.getName().includes("\u2764") && entity.getUUID() !== this.lividData.correctLividEntity.getUUID()) {
                    cancel(event);
                }
            }
        }
    }







    findNeededClicks() {
        let itemsHighlight = [];
        if (ChatLib.removeFormatting(Player.getContainer().getName()).startsWith("What starts with: '") && ChatLib.removeFormatting(Player.getContainer().getName()).endsWith("'?")) {
            let letter = ChatLib.removeFormatting(Player.getContainer().getName()).substr(19, 1).toLowerCase();
            let i = 0;
            Player.getContainer().getItems().forEach((item) => {
                if (ChatLib.removeFormatting(item.getName()).toLowerCase().startsWith(letter) && !item.isEnchanted()) {
                    itemsHighlight.push(i);
                }
                i++;
            });
        }
        if (ChatLib.removeFormatting(Player.getContainer().getName()).startsWith("Select all the ") && ChatLib.removeFormatting(Player.getContainer().getName()).endsWith(" items!")) {
            let color = ChatLib.removeFormatting(Player.getContainer().getName()).substr(15).replace(" items!", "").toLowerCase();
            let i = 0;
            Player.getContainer().getItems().forEach((item) => {
                let name = ChatLib.removeFormatting(item.getName()).toLowerCase();
                Object.entries(wrongColorList).forEach(([from, to]) => {
                    name.replace(from, to);
                });
                if (name.replace("wool", "white wool").includes(color) && !item.isEnchanted()) {
                    itemsHighlight.push(i);
                }
                i++;
            });
        }
        if (ChatLib.removeFormatting(Player.getContainer().getName()) === "Click in order!") {
            let i = 0;
            let number = 100;
            Player.getContainer().getItems().forEach((item, i) => {
                if (parseInt(ChatLib.removeFormatting(item.getName())) < number && item.getMetadata() === 14) {
                    number = parseInt(ChatLib.removeFormatting(item.getName()));
                }
                i++;
            });
            i = 0;
            Player.getContainer().getItems().forEach((item) => {
                if (parseInt(ChatLib.removeFormatting(item.getName())) === number) {
                    itemsHighlight.push(i);
                }
                i++;
            });
            i = 0;
            Player.getContainer().getItems().forEach((item) => {
                if (parseInt(ChatLib.removeFormatting(item.getName())) === number + 1) {
                    itemsHighlight2.push(i);
                }
                i++;
            });
        }
    }

    onWorldLoad() {
        this.lastWorldload = Date.now();
        this.goneInBonus = false;
        this.bloodOpenedBonus = false;
        this.mimicDead = false;
        this.lividData.correctLividColor = undefined;
        this.lividData.correctLividColorHP = undefined;
        this.lividData.sayLividColors = [];
        this.lividData.sayLividColors2 = [];
        this.lividData.correctLividEntity = undefined;
        this.lividHpElement && this.lividHpElement.setText("");
        this.nameToUuid = {
            "you": Player.getUUID().toString()
        };

        this.spiritBowPickUps = [];
        this.bearSpawning = 0;
        this.ffCountdownTo = 0;
        this.startSpawningTime = 0;
        this.spawnIdThing = 0;
        this.eMovingThing = {};
        this.bloodX = -1;
        this.bloodY = -1;
        this.blazeX = -1;
        this.blazeY = -1;
        this.skulls = [];
        this.arrows = [];
        this.blazes = [];
        World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach((e) => {
            if (e.getEntity()["func_71124_b"](4) && e.getEntity()["func_71124_b"](4)["func_82833_r"]().endsWith(getSkullName())) {
                this.addSkull(e);
            }
        });
        World.getAllEntitiesOfType(EntityBlaze).forEach((e) => {
            this.addBlaze(e);
        });



    }

    step2() {

        if (this.ffCountdownTo && this.ffCountdownTo > 0) {
            this.fireFreezeTimerElement.setText("&dFire freeze in: &c" + (Math.max(0, this.ffCountdownTo - Date.now()) / 1000).toFixed(2) + "s");
        } else {
            this.fireFreezeTimerElement.setText("");
        }
        if (this.bearSpawning && this.bearSpawning > 0 && this.isInDungeon()) {
            this.spiritBearSpawnElement.setText("&dBear spawned in: &c" + (Math.max(0, this.bearSpawning - Date.now()) / 1000).toFixed(2) + "s");
        } else {
            this.spiritBearSpawnElement.setText("");
        }
        if (this.scoreCalculation.getValue()) this.calculateDungeonScore();
        if (this.bloodCampAssist.getValue() && this.skulls) {
            this.skulls.forEach((skull) => {
                let skullE = skull.getEntity();


                let xSpeed = skullE["field_70165_t"] - skullE["field_70142_S"];
                let ySpeed = skullE["field_70163_u"] - skullE["field_70137_T"];
                let zSpeed = skullE["field_70161_v"] - skullE["field_70136_U"];

                if (this.eMovingThing[skull.getUUID().toString()] && Date.now() - this.eMovingThing[skull.getUUID().toString()].startMovingTime > 5000) {
                    this.eMovingThing[skull.getUUID().toString()].logged = true;
                    this.spawnIdThing++;

                    delete this.eMovingThing[skull.getUUID().toString()];
                    this.skulls = this.skulls.filter((e) => {
                        if (e.getUUID().toString() === skull.getUUID().toString()) {
                            return false;
                        }
                        return true;
                    });
                    return;
                }

                if (xSpeed !== 0 || ySpeed !== 0) {
                    if (!this.eMovingThing[skull.getUUID().toString()]) this.eMovingThing[skull.getUUID().toString()] = { startMovingTime: Date.now(), startX: skullE["field_70165_t"], startY: skullE["field_70163_u"], startZ: skullE["field_70161_v"] };

                    if (this.eMovingThing[skull.getUUID().toString()].lastX !== skullE["field_70165_t"] || this.eMovingThing[skull.getUUID().toString()].lastY !== skullE["field_70163_u"]) {
                        this.eMovingThing[skull.getUUID().toString()].timeTook = Date.now() - this.eMovingThing[skull.getUUID().toString()].startMovingTime;
                    } else if (!this.eMovingThing[skull.getUUID().toString()].logged && (skullE["field_70128_L"] || !skullE["func_71124_b"](4) || !skullE["func_71124_b"](4)["func_82833_r"]().endsWith(getSkullName()))) {
                        this.eMovingThing[skull.getUUID().toString()].logged = true;
                        this.spawnIdThing++;

                        delete this.eMovingThing[skull.getUUID().toString()];
                        this.skulls = this.skulls.filter((e) => {
                            if (e.getUUID().toString() === skull.getUUID().toString()) {
                                return false;
                            }
                            return true;
                        });
                        return;
                    }

                    this.eMovingThing[skull.getUUID().toString()].lastX = skullE["field_70165_t"];
                    this.eMovingThing[skull.getUUID().toString()].lastY = skullE["field_70163_u"];

                    if (!this.startSpawningTime) this.startSpawningTime = Date.now();
                }

                if (this.eMovingThing[skull.getUUID().toString()] && this.eMovingThing[skull.getUUID().toString()].timeTook) {
                    let startPoint = [skullE["field_70165_t"], skullE["field_70163_u"], skullE["field_70161_v"]];

                    let xSpeed2 = (startPoint[0] - this.eMovingThing[skull.getUUID().toString()].startX) / this.eMovingThing[skull.getUUID().toString()].timeTook;
                    let ySpeed2 = (startPoint[1] - this.eMovingThing[skull.getUUID().toString()].startY) / this.eMovingThing[skull.getUUID().toString()].timeTook;
                    let zSpeed2 = (startPoint[2] - this.eMovingThing[skull.getUUID().toString()].startZ) / this.eMovingThing[skull.getUUID().toString()].timeTook;

                    let time = (this.spawnIdThing >= 4 ? 2900 : 4875) - this.eMovingThing[skull.getUUID().toString()].timeTook;
                    let endPoint = [startPoint[0] + xSpeed2 * time, startPoint[1] + ySpeed2 * time, startPoint[2] + zSpeed2 * time];

                    this.eMovingThing[skull.getUUID().toString()].endPointLast = this.eMovingThing[skull.getUUID().toString()].endPoint;
                    this.eMovingThing[skull.getUUID().toString()].endPoint = endPoint;
                    this.eMovingThing[skull.getUUID().toString()].endPointUpdated = Date.now();




                }
            });
        }

        if (this.blazeX !== -1) {
            this.blazes = this.blazes.filter((e) => !e.getEntity()["field_70128_L"]);

            this.blazes.sort((a, b) => a.getEntity().func_110143_aJ() - b.getEntity().func_110143_aJ());
            if (
                World.getBlockAt(this.blazeX + 17 - 43, 18, this.blazeY + 16 - 43).
                    getType().
                    getID() === 9) {
                this.blazes = this.blazes.reverse();
            }
        }






































        if (this.spiritBearSpawnTimer.getValue() && (this.FeatureManager.features["dataLoader"].class.dungeonFloor === "F4" || this.FeatureManager.features["dataLoader"].class.dungeonFloor === "M4")) {
            let id = World.getBlockAt(7, 77, 34).type.getID();

            if ((!this.bearSpawning || this.bearSpawning < 0 && this.bearSpawning > -Date.now() + 500) && id === 169) {
                this.bearSpawning = Date.now() + 3500;
            }
        }
    }

    addSkull(skull) {
        if (this.bloodX !== -1) {
            let xA = skull.getX() + 8 - (skull.getX() + 8) % 32;
            let yA = skull.getZ() + 8 - (skull.getZ() + 8) % 32;

            if (xA !== this.bloodX || yA !== this.bloodY) return;
        } else {
            if (skull.getEntity()["func_71124_b"](4)["func_82833_r"]().trim() === getPlayerHeadName().replace("%s", Player.getName())) {
                this.bloodX = skull.getX() + 8 - (skull.getX() + 8) % 32;
                this.bloodY = skull.getZ() + 8 - (skull.getZ() + 8) % 32;
                this.skulls = [];
                World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach((e) => {
                    if (e.getEntity()["func_71124_b"](4) && e.getEntity()["func_71124_b"](4)["func_82833_r"]().endsWith(getSkullName())) {
                        this.addSkull(e);
                    }
                });
            }
            return;
        }
        this.skulls.push(skull);
    }

    addBlaze(blaze) {
        if (!this.FeatureManager.features["dataLoader"].class.dungeonFloor) return;
        if (this.blazeX === -1) {
            this.blazes.push(blaze);
            let locs = {};

            this.blazes.forEach((b) => {
                if (!locs[b.getX() + 8 - (b.getX() + 8) % 32 + "_" + (b.getZ() + 8 - (b.getZ() + 8) % 32)]) locs[b.getX() + 8 - (b.getX() + 8) % 32 + "_" + (b.getZ() + 8 - (b.getZ() + 8) % 32)] = 0;
                locs[b.getX() + 8 - (b.getX() + 8) % 32 + "_" + (b.getZ() + 8 - (b.getZ() + 8) % 32)]++;
            });

            Object.keys(locs).forEach((k) => {
                if (locs[k] === 4) {
                    [this.blazeX, this.blazeY] = k.split("_").map((a) => ~~a);
                }
            });

            if (this.blazeX !== -1) {
                this.blazes = [];
                World.getAllEntitiesOfType(EntityBlaze).forEach((e) => {
                    if (e.getX() + 8 - (e.getX() + 8) % 32 === this.blazeX && e.getZ() + 8 - (e.getZ() + 8) % 32 === this.blazeY) {
                        this.blazes.push(e);
                    }
                });
            }
        } else {
            if (blaze.getX() + 8 - (blaze.getX() + 8) % 32 === this.blazeX && blaze.getZ() + 8 - (blaze.getZ() + 8) % 32 === this.blazeY) {
                this.blazes.push(blaze);
                this.blazes.sort((a, b) => a.getEntity().func_110143_aJ() - b.getEntity().func_110143_aJ());
                if (
                    World.getBlockAt(this.blazeX + 17 - 43, 18, this.blazeY + 16 - 43).
                        getType().
                        getID() === 9) {
                    this.blazes = this.blazes.reverse();
                }
            }
        }
    }

    stepNotDung() {
        if (Date.now() - this.lastWorldload < 5000) return;
        this.inBoss = false;
    }

    step() {

        if (this.ffCountdownTo && this.ffCountdownTo > 0) {
            this.fireFreezeTimerElement.setText("&dFire freeze in: &c" + (Math.max(0, this.ffCountdownTo - Date.now()) / 1000).toFixed(2) + "s");
        } else {
            this.fireFreezeTimerElement.setText("");
        }

        if (this.bearSpawning && this.bearSpawning > 0) {
            this.spiritBearSpawnElement.setText("&dBear spawned in: &c" + (Math.max(0, this.bearSpawning - Date.now()) / 1000).toFixed(2) + "s");
        } else {
            this.spiritBearSpawnElement.setText("");
        }
        if (!Player.getX()) return;
        World.getAllPlayers().forEach((p) => {
            this.nameToUuid[p.getName().toLowerCase()] = p.getUUID().toString();
        });
        this.failedPuzzleCount = 0;
        this.totalPuzzleCount = 0;
        this.completedPuzzleCount = 0;
        TabList.getNames().forEach((n) => {
            let name = ChatLib.removeFormatting(n).trim().split(" ");
            let end = name.pop();

            if (end !== "[\u2726]" && end !== "[\u2714]" && end !== "[\u2716]") {
                end = name.pop();

                if (end !== "[\u2726]" && end !== "[\u2714]" && end !== "[\u2716]") return;
            }
            this.totalPuzzleCount++;
            if (end === "[\u2716]") this.failedPuzzleCount++;
            if (end === "[\u2714]") this.completedPuzzleCount++;
        });

        if (this.lividFindEnabled.getValue() && (this.FeatureManager.features["dataLoader"].class.dungeonFloor === "F5" || this.FeatureManager.features["dataLoader"].class.dungeonFloor === "M5")) {
            let type = World.getBlockAt(3, 108, 30).getMetadata();

            let typeReplace = {
                0: "Vendetta",
                2: "Crossed",
                4: "Arcade",
                5: "Smile",
                6: "Crossed",
                7: "Doctor",
                8: "Doctor",
                10: "Purple",
                11: "Scream",
                13: "Frog",
                14: "Hockey"
            };


            World.getAllEntities().forEach((entity) => {
                let entityName = entity.getName();

                if (entityName.includes("Livid") && entityName.includes("\u2764")) {

                    if (entityName.substr(1, 1) === this.lividData.lividColor[typeReplace[type]].split("").pop()) {
                        this.lividHpElement.setText(entityName);
                        this.lividData.correctLividEntity = entity;
                    }
                }
            });
        }

        if (this.lividData.correctLividEntity) {
            if (!this.renderEntityEvent.enabled) {
                this.renderEntityEvent.register();
            }
        } else {
            if (this.renderEntityEvent.enabled) {
                this.renderEntityEvent.unregister();
            }
        }

        this.spiritBowPickUps = this.spiritBowPickUps.filter((pickUp) => Date.now() - pickUp < 20000);
        if (this.spiritBowPickUps[0] && this.isInDungeon()) {
            this.spiritBowDestroyElement.setText("&dBow Destroyed in: &c" + Math.round((this.spiritBowPickUps[0] + 20000 - Date.now()) / 1000) + "s");
        } else {
            this.spiritBowDestroyElement.setText("");
        }

        if (this.bloodCampAssist.getValue()) {
            this.todoE.forEach((e) => {
                let en = new Entity(e);

                if (en.getName().trim() === getArmorStandName() && e["func_71124_b"](4) && e["func_71124_b"](4)["func_82833_r"]().endsWith(getSkullName())) {
                    this.addSkull(en);
                }
            });

            this.todoE = [];
        }

        let averageExp = this.lastDungExps.reduce((a, b) => a + b, 0) / this.lastDungExps.length;
        let averageLength = (this.lastDungFinishes[this.lastDungFinishes.length - 1] - this.lastDungFinishes[0]) / (this.lastDungFinishes.length - 1);
        let runsperHour = 60000 * 60 / averageLength;
        let expPerHour = averageExp * runsperHour;

        if (Date.now() - this.lastDungFinishes[this.lastDungFinishes.length - 1] < 60000 * 5 || this.FeatureManager.features["dataLoader"].class.dungeonFloor) {
            if (this.lastDungFinishes.length > 1) {
                this.runSpeedRatesElement.setText("&6Run speed&7> &f" + Math.floor(averageLength / 60000) + ":" + ((Math.floor(averageLength / 1000) % 60 < 10 ? "0" : "") + Math.floor(averageLength / 1000) % 60) + "\n&6Exp/hour&7> &f" + numberWithCommas(Math.round(expPerHour)) + "\n&6Runs/hour&7> &f" + Math.floor(runsperHour));
            } else {
                this.runSpeedRatesElement.setText("&6Run speed&7> &fLoading...\n&6Exp/hour&7> &fLoading...\n&6Runs/hour&7> &fLoading...");
            }
        } else {
            this.runSpeedRatesElement.setText("");
        }
    }

    step_1fps() {
        if (this.IceSprayWarn.getValue()) {
            World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach((iceSprayEntity) => {
                let iceSprayEntityNameRF = ChatLib.removeFormatting(iceSprayEntity.getName());
                if (iceSprayEntityNameRF.includes("Ice Spray Wand") && !this.iceSprayEntityPH) {
                    Client.showTitle(`&r&6&l[&b&l&kO&6&l] ${iceSprayEntityNameRF.toUpperCase()} &6&l[&b&l&kO&6&l]`, "", 0, 40, 10);
                    ChatLib.chat(`&6&lRARE DROP! &r${iceSprayEntity.getName()}`);
                    this.iceSprayEntityPH = iceSprayEntity;
                }
            });

            if (this.iceSprayEntityPH) {
                if (this.iceSprayEntityPH.getEntity()["field_70128_L"]) {
                    this.iceSprayEntityPH = undefined;
                }
            }
        }
    }

    initVariables() {
        this.lividFindEnabled = undefined;
        this.lividData = undefined;
        this.hudElements = [];
    }

    onDisable() {
        this.hudElements.forEach((h) => h.delete());
        this.unloadf7data();
        this.initVariables();
    }
}


module.exports = {
    class: new DungeonSolvers
};


function getSkullName() {
    if (translate) {
        return translate.func_74805_b("item.skull.char.name");
    }

    return "Head";
}

function getPlayerHeadName() {
    if (translate) {
        return translate.func_74805_b("item.skull.player.name");
    }

    return "%s's Head";
}
function getArmorStandName() {
    if (translate) {
        return translate.func_74805_b("item.armorStand.name");
    }

    return "Armor Stand";
}