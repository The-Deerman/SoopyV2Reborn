import renderLibs from"../../../../guimanager/renderLibs.js";

import ToggleSetting from"../../../settings/settingThings/toggle.js";
import Cosmetic from"../../cosmetic.js";

const ModelDragon=Java.type("net.minecraft.client.model.ModelDragon");

if(!GlStateManager){

var GlStateManager=Java.type("net.minecraft.client.renderer.GlStateManager");
}
const Essential=Java.type("gg.essential.Essential");
const EssentialCosmeticSlot=Java.type("gg.essential.mod.cosmetics.CosmeticSlot");
const EssentialBone=Java.type("gg.essential.model.Bone");

let dragon=new ModelDragon(0);
let textures=new Map;
let loadingTextures=new Set;
function loadTexture(id){
new Thread(()=>{
loadingTextures.add(id);
textures.set(id,renderLibs.getImage("https://soopy.dev/api/soopyv2/textures/cosmetic/tail/"+id+"/img.png",true));
}).start();
}
loadTexture("classic");
let wing=getField(dragon,"field_78225_k");
let wingTip=getField(dragon,"field_78222_l");

class Tail extends Cosmetic{
constructor(player,parent){
super(player,parent,"tail");

this.animOffset=Math.random()*20*Math.PI;
this.lastRender=Date.now();

this.state=0;

this.ticks=0;

if(!textures.has(this.settings.texture)&&!loadingTextures.has(this.settings.texture)){
loadTexture(this.settings.texture);
}
}

onCosmeticMessage(data){
this.state=data[0];
}

onRenderEntity(ticks,isInGui){
if(this.player.getPlayer()["func_98034_c"](Player.getPlayer())||this.player.getPlayer()["func_82150_aj"]()){
return;
}
if(!textures.has("classic"))return;

let isSelfPlayer=this.isSelfPlayer;
let isInInv=isSelfPlayer&&ticks===1;
let thirdPersonView=Client.getMinecraft()["field_71474_y"]["field_74320_O"];

if(!this.parent.firstPersonVisable.getValue()&&thirdPersonView===0&&isSelfPlayer&&!isInInv)return;




let timeSince=(Date.now()-this.lastRender)/1000;
this.lastRender=Date.now();

let rotation=isInInv?0:this.player.getPlayer()["field_70760_ar"]+(this.player.getPlayer()["field_70761_aq"]-this.player.getPlayer()["field_70760_ar"])*ticks;

this.animOffset+=1*timeSince;


GlStateManager["func_179094_E"]();
GlStateManager["func_179147_l"]();
Tessellator.colorize(this.settings.color.r,this.settings.color.g,this.settings.color.b);

if(!isSelfPlayer){
Tessellator.translate(
this.player.getPlayer()["field_70142_S"]+(this.player.getPlayer()["field_70165_t"]-this.player.getPlayer()["field_70142_S"])*ticks-(Player.getPlayer()["field_70142_S"]+(Player.getPlayer()["field_70165_t"]-Player.getPlayer()["field_70142_S"])*ticks),
this.player.getPlayer()["field_70137_T"]+(this.player.getPlayer()["field_70163_u"]-this.player.getPlayer()["field_70137_T"])*ticks-(Player.getPlayer()["field_70137_T"]+(Player.getPlayer()["field_70163_u"]-Player.getPlayer()["field_70137_T"])*ticks),
this.player.getPlayer()["field_70136_U"]+(this.player.getPlayer()["field_70161_v"]-this.player.getPlayer()["field_70136_U"])*ticks-(Player.getPlayer()["field_70136_U"]+(Player.getPlayer()["field_70161_v"]-Player.getPlayer()["field_70136_U"])*ticks));
}

if(textures.get(this.settings.texture||"classic")){
Tessellator.bindTexture(textures.get(this.settings.texture||"classic"));
}else{
Tessellator.bindTexture(textures.get("classic"));
}

if(this.player.getPlayer()["field_70154_o"]){
rotation=this.player.getPlayer()["field_70759_as"]+(this.player.getPlayer()["field_70759_as"]-this.player.getPlayer()["field_70758_at"])*ticks;
}


GlStateManager["func_179129_p"]();
Tessellator.scale(this.settings.scale,this.settings.scale,this.settings.scale);

wing["func_78791_b"](1);
wing["field_78795_f"]=a;
wing["field_78808_h"]=b;
wingTip["field_78808_h"]=c;


Tessellator.colorize(1,1,1);
GlStateManager["func_179089_o"]();

GlStateManager["func_179084_k"]();
GlStateManager["func_179121_F"]();
}

onCommand(){
}

onTick(){
this.ticks++;
if(this.ticks%20===0){
this.sendCosmeticsData([this.state]);
}
}

removeEssentialCosmetics(){
if(!this.player.getPlayer()||!this.player.getPlayer().getCosmeticsState||!this.player.getPlayer().getCosmeticsState()||!this.player.getPlayer().getCosmeticsState().getCosmetics||!this.player.getPlayer().getCosmeticsState().getCosmetics())return;


let fullBodyCosmetic=this.player.getPlayer().getCosmeticsState().getCosmetics().get(EssentialCosmeticSlot.FULL_BODY);
if(fullBodyCosmetic){
let cosmetic=this.player.getPlayer().getCosmeticsState().getModels().get(Essential.instance.getConnectionManager().getCosmeticsManager().getCosmetic(fullBodyCosmetic));
if(cosmetic){
let model=cosmetic.getModel().getModel();

let bones=model.getBones(model.getRootBone());

bones.forEach((b)=>{
if(b.boxName.startsWith("tail_")){
setField(b,"showModel",false);

this.parent.hiddenEssentialCosmetics.push(b);
}
});
}
}
}}


export default Tail;


function getField(e,field){

let field2=e.class.getDeclaredField(field);

field2.setAccessible(true);

return field2.get(e);
}

function setField(e,field,value){

let field2=e.class.getDeclaredField(field);

field2.setAccessible(true);

return field2.set(e,value);
}
let a=0;
let b=0;
let c=0;
register("command",(v)=>{
a=parseFloat(v);
}).setName("seta",true);
register("command",(v)=>{
b=parseFloat(v);
}).setName("setb",true);
register("command",(v)=>{
c=parseFloat(v);
}).setName("setc",true);