import renderLibs from"../../../../../guimanager/renderLibs.js";

import ToggleSetting from"../../../settings/settingThings/toggle.js";
import Cosmetic from"../../cosmetic.js";

const ModelDragon=Java.type("net.minecraft.client.model.ModelDragon");

if(!GlStateManager){

var GlStateManager=Java.type("net.minecraft.client.renderer.GlStateManager");
}
const Essential=Java.type("gg.essential.Essential");
const EssentialCosmeticSlot=Java.type("gg.essential.mod.cosmetics.CosmeticSlot");
const EssentialBone=Java.type("gg.essential.model.Bone");

const FACING=Java.type("net.minecraft.block.BlockDirectional").field_176387_N;
let dragon=new ModelDragon(0);
let textures=new Map;
let loadingTextures=new Set;
function loadTexture(id){
new Thread(()=>{
loadingTextures.add(id);
textures.set(id,renderLibs.getImage("https://soopy.dev/api/soopyv2/textures/cosmetic/dragon/"+id+"/img.png",true));
}).start();
}
loadTexture("classic");
let wing=getField(dragon,"field_78225_k");
let wingTip=getField(dragon,"field_78222_l");

class DragonWings extends Cosmetic{
constructor(player,parent){
super(player,parent,"dragon_wings");

this.animOffset=Math.random()*20*Math.PI;
this.lastRender=Date.now();

this.lastFlapSound=this.animOffset;
this.i=0;

this.state=0;

this.ticks=0;

this.flying=false;

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


let horisontalSpeed=Math.hypot(this.player.getPlayer()["field_70165_t"]-this.player.getPlayer()["field_70142_S"],this.player.getPlayer()["field_70161_v"]-this.player.getPlayer()["field_70136_U"]);

let verticleSpeed=this.player.getPlayer()["field_70163_u"]-this.player.getPlayer()["field_70137_T"];

this.animOffset+=Math.min(1,horisontalSpeed)*10*timeSince+1*timeSince;

let flapAmountMultiplyerNoEnd=1;
let flapAmountMultiplyer=1;

let wingEndOffsetThing=0;

flapAmountMultiplyerNoEnd+=Math.min(5,horisontalSpeed*5);
let flapMainOffsetThing=0;

let wingBackAmount=0;

let shouldStandStillWingCurve=true;

if(this.player.getPlayer()["field_70172_ad"]>17){
this.animOffset+=25*timeSince;
}



if(this.flying){
shouldStandStillWingCurve=false;
this.animOffset+=5*timeSince;

flapAmountMultiplyer*=1.75;

if(isSelfPlayer&&thirdPersonView===0){
if(!this.parent.lessFirstPersonVisable.getValue()){
flapAmountMultiplyerNoEnd+=0.4;
flapMainOffsetThing=0.3;
}
}else{
flapAmountMultiplyer*=1.25;
flapAmountMultiplyer*=0.9;
flapMainOffsetThing=0.1;
wingEndOffsetThing+=-0.1;
}

wingEndOffsetThing+=-0.75;

if(verticleSpeed>0){
this.animOffset+=verticleSpeed*25*timeSince;
}
}else{
if(this.lastFlapSound<this.animOffset-this.animOffset%(Math.PI*2)){
this.lastFlapSound=this.animOffset-this.animOffset%(Math.PI*2);
}
}
if(verticleSpeed<-0.5){
wingBackAmount=Math.min(1,(verticleSpeed+0.5)*-1.5);

this.animOffset+=(verticleSpeed+0.5)*-3*timeSince;
}

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
if(!this.player.getPlayer()["func_70608_bn"]()){
Tessellator.rotate(180-rotation,0,1,0);

Tessellator.translate(0,1.2,0.13);

if(this.player.getPlayer()["func_70093_af"]()){
Tessellator.translate(0,-0.125,0);
Tessellator.rotate(-20,1,0,0);

Tessellator.translate(0,0,0.1);
if(isSelfPlayer&&thirdPersonView===0){}else{
Tessellator.translate(0,-0.125,0);
}
}

if(isSelfPlayer&&!isInInv&&thirdPersonView===0){

Tessellator.translate(0,0.25,0.003*this.player.getPitch());
}
}



wing["field_78796_g"]=0.25;

if(this.state===1){
wing["field_78796_g"]=-0.25;
}

let shouldStandingStillWingThing=false;

let changeStandingStillWingThing=0;

if(horisontalSpeed<0.01){
if(!this.flying){
let amt=(this.animOffset+Math.PI/2)%(20*Math.PI);
if(amt<1*Math.PI){
this.animOffset+=2*timeSince*Math.min(1,amt/(1*Math.PI)*2);

flapAmountMultiplyer+=amt/(1*Math.PI)/2;
}else if(amt<2*Math.PI){
this.animOffset+=2*timeSince*Math.min(1,(1-(amt/(1*Math.PI)-1))*2);

flapAmountMultiplyer+=(1-(amt/(1*Math.PI)-1))/2;
}
}
if(this.player.getPlayer()["func_70093_af"]()){
if(this.player.getPlayer()["field_70125_A"]>20){
shouldStandingStillWingThing=true;
shouldStandStillWingCurve=false;
changeStandingStillWingThing=Math.max(0,this.player.getPlayer()["field_70125_A"]/600);
}
}
}

if(shouldStandingStillWingThing){
wing["field_78796_g"]=0.25+changeStandingStillWingThing*3;
}
if(this.player.getPlayer()["func_70608_bn"]()){

try{
let facing=World.getWorld().func_180495_p(this.player.getPlayer()["field_71081_bT"])["func_177229_b"](FACING)["func_176736_b"]();

let rotation=0;
switch(facing){
case 0:
rotation=180;
Tessellator.translate(0,0,-0.5);
break;
case 1:
rotation=90;
Tessellator.translate(0.5,0,0);
break;
case 2:
rotation=0;
Tessellator.translate(0,0,0.5);
break;
case 3:
rotation=270;
Tessellator.translate(-0.5,0,0);
break;}



Tessellator.rotate(rotation,0,1,0);
}catch(e){}
Tessellator.translate(0,-this.settings.scale*25,0);

wing["field_78795_f"]=0;

wing["field_78808_h"]=-0.45+Math.sin(this.animOffset/5)*0.03;


wingTip["field_78808_h"]=-2.5+Math.sin(this.animOffset/5)*0.03;
}else if(wingBackAmount===0){


if(this.state===4){

wing["field_78795_f"]=0.85-Math.cos(this.animOffset)*0.2+0.75;

wing["field_78808_h"]=(Math.sin(this.animOffset)+0.125)*0.1-0.4+0.75;

wingTip["field_78808_h"]=Math.sin(this.animOffset+1.5)*0.1+1.5;

}else{


let wing_goback_amount=0.15/(Math.min(1,horisontalSpeed)*3+0.25);
let temp_wing_thing=1;

if(shouldStandingStillWingThing){
wing_goback_amount/=1+changeStandingStillWingThing/50;
flapAmountMultiplyer/=1+changeStandingStillWingThing/50;

temp_wing_thing+=changeStandingStillWingThing*50;
}

let wing_tilt_offset=-Math.min(0.8,horisontalSpeed*3)+0.3;


if(shouldStandingStillWingThing){
wing_tilt_offset+=changeStandingStillWingThing*4;
}

if(this.state===1){
wing_tilt_offset-=0.5;
}

wing["field_78795_f"]=0.85-Math.cos(this.animOffset)*0.2+wing_tilt_offset-(flapAmountMultiplyer-1)/3;

let temp_horis_wingthing=0;
let wingTipFlapAmt=1;
if(shouldStandingStillWingThing){
temp_horis_wingthing=-changeStandingStillWingThing*0.75;
}
if(this.state===1){
temp_horis_wingthing-=0.5;
wingEndOffsetThing+=0.5;
wingTipFlapAmt*=0.5;
}

wing["field_78808_h"]=(Math.sin(this.animOffset)/temp_wing_thing+0.125)*wing_goback_amount*(1+(flapAmountMultiplyer-1)*1)*flapAmountMultiplyerNoEnd-0.4-wing_tilt_offset/3+temp_horis_wingthing+flapMainOffsetThing;

let standStillCurveThing=shouldStandStillWingCurve?(2-flapAmountMultiplyer)*0.5:0;

wingTip["field_78808_h"]=standStillCurveThing-(Math.sin(this.animOffset+1.5+(1-temp_wing_thing)/8.5)/(1+(temp_wing_thing-1)/3)+0.5)*wingTipFlapAmt*0.75*(1+(flapAmountMultiplyer-1)*1)/(1+temp_horis_wingthing)-(1-flapAmountMultiplyer)*2-(1-temp_wing_thing)/10+wingEndOffsetThing;

}
}else{

let wing_tilt_offset=-Math.min(0.8,horisontalSpeed*3);
wing["field_78795_f"]=0.75-Math.cos(this.animOffset)*0.2+wing_tilt_offset-wingBackAmount/2;


wing["field_78808_h"]=-wingBackAmount;


wingTip["field_78808_h"]=-(Math.sin(this.animOffset)*0.5+0.3);
}

GlStateManager["func_179129_p"]();

let wing_center_dist=(0-Math.log(1000*this.settings.scale+0.01)-2-100000*this.settings.scale*this.settings.scale)/1000;



let a=wing["field_78795_f"];
let b=wing["field_78808_h"];
let c=wingTip["field_78808_h"];
if(this.state===2){

wing["field_78795_f"]=0.85-Math.cos(this.animOffset)*0.2+0.75;

wing["field_78808_h"]=(Math.sin(this.animOffset)+0.125)*0.1-0.4+0.75;

wingTip["field_78808_h"]=Math.sin(this.animOffset+1.5)*0.1+1.5;
}

Tessellator.translate(-wing_center_dist,0,0);
Tessellator.scale(this.settings.scale,this.settings.scale,this.settings.scale);
wing["func_78791_b"](1);
wing["field_78795_f"]=a;
wing["field_78808_h"]=b;
wingTip["field_78808_h"]=c;

if(this.state===3){
wing["field_78795_f"]=0.85-Math.cos(this.animOffset)*0.2+0.75;

wing["field_78808_h"]=(Math.sin(this.animOffset)+0.125)*0.1-0.4+0.75;

wingTip["field_78808_h"]=Math.sin(this.animOffset+1.5)*0.1+1.5;
}
Tessellator.translate(2*wing_center_dist/this.settings.scale,0,0);
Tessellator.scale(-1,1,1);
wing["func_78791_b"](1);


if(this.player.getPlayer()["field_70737_aN"]>0){
GlStateManager["func_179094_E"]();
GlStateManager["func_179143_c"](514);
GlStateManager["func_179090_x"]();
GlStateManager["func_179147_l"]();
GlStateManager["func_179112_b"](770,771);
GlStateManager.func_179131_c(1,0,0,0.25);

Tessellator.scale(-1,1,1);
Tessellator.translate(-2*wing_center_dist/this.settings.scale,0,0);
wing["func_78791_b"](1);

Tessellator.translate(2*wing_center_dist/this.settings.scale,0,0);
Tessellator.scale(-1,1,1);
wing["func_78791_b"](1);

GlStateManager["func_179098_w"]();
GlStateManager["func_179084_k"]();
GlStateManager["func_179143_c"](515);
GlStateManager["func_179121_F"]();
}
Tessellator.colorize(1,1,1);
GlStateManager["func_179089_o"]();

GlStateManager["func_179084_k"]();
GlStateManager["func_179121_F"]();
}

testPlaySound(){
if(this.player.getPlayer()["func_98034_c"](Player.getPlayer())){
return;
}
if(!this.parent.ownCosmeticAudio.getValue()){
return;
}

if(this.player.getPlayer()["func_70608_bn"]())return;

let horisontalSpeed=Math.hypot(this.player.getPlayer()["field_70165_t"]-this.player.getPlayer()["field_70142_S"],this.player.getPlayer()["field_70161_v"]-this.player.getPlayer()["field_70136_U"]);



if(this.flying){

if(this.animOffset-this.lastFlapSound>2*Math.PI){

let dist=Math.hypot(Player.getX()-this.player.getX(),Player.getY()-this.player.getY(),Player.getZ()-this.player.getZ())+1;

World.playSound("mob.enderdragon.wings",this.settings.scale*15*Math.min(1,50/(dist*dist)),1);
this.lastFlapSound=this.animOffset-this.animOffset%(Math.PI*2);
}
}

if(horisontalSpeed<0.01){
if(!this.flying){
let amt=(this.animOffset+Math.PI/2)%(20*Math.PI);
if(amt<1*Math.PI){
if(amt>0.65*Math.PI&&2*Math.PI+this.animOffset-this.lastFlapSound>2*Math.PI){

let dist=Math.hypot(Player.getX()-this.player.getX(),Player.getY()-this.player.getY(),Player.getZ()-this.player.getZ())+1;

World.playSound("mob.enderdragon.wings",Math.max(0.005,this.settings.scale-0.005)*25*Math.min(1,50/Math.min(1,dist*dist))/50,1-Math.max(0.005,this.settings.scale-0.005)*25);
this.lastFlapSound=2*Math.PI+this.animOffset-this.animOffset%(Math.PI*2);
}
}
}
}
}

onCommand(pose){
if(!pose){
ChatLib.chat("valid poses: 'default' 'raised' 'hugl' 'hugr' 'hugs' ");
return;
}
pose=pose.toLowerCase();
if(pose==="raised"){
this.state=1;
this.sendCosmeticsData([1]);
ChatLib.chat("Set wing pose to raised");
return;
}
if(pose==="hugl"){
this.state=2;
this.sendCosmeticsData([2]);
ChatLib.chat("Set wing pose to hugl");
return;
}
if(pose==="hugr"){
this.state=3;
this.sendCosmeticsData([3]);
ChatLib.chat("Set wing pose to hugr");
return;
}
if(pose==="hugs"){
this.state=4;
this.sendCosmeticsData([4]);
ChatLib.chat("Set wing pose to hugs");
return;
}
if(pose==="t"){
this.state=4;
this.sendCosmeticsData([4]);
ChatLib.chat("Set wing pose to hugs");
return;
}
this.state=0;
this.sendCosmeticsData([0]);
ChatLib.chat("Set wing pose to default");
}

onTick(){
this.updateIfNotRendering();

this.testPlaySound();

this.ticks++;
if(this.ticks%20===0){
this.sendCosmeticsData([this.state]);
}
}

removeEssentialCosmetics(){
if(!this.player.getPlayer()||!this.player.getPlayer().getCosmeticsState||!this.player.getPlayer().getCosmeticsState()||!this.player.getPlayer().getCosmeticsState().getCosmetics||!this.player.getPlayer().getCosmeticsState().getCosmetics())return;

let wingCosmetic=this.player.getPlayer().getCosmeticsState().getCosmetics().get(EssentialCosmeticSlot.WINGS);
if(wingCosmetic!==null){
let cosmetic=this.player.getPlayer().getCosmeticsState().getModels().get(Essential.instance.getConnectionManager().getCosmeticsManager().getCosmetic(wingCosmetic));
if(cosmetic){
let model=cosmetic.getModel().getModel();

let bones=model.getBones(model.getRootBone());

bones.forEach((b)=>{
setField(b,"showModel",false);

this.parent.hiddenEssentialCosmetics.push(b);
});
}
}else{
let fullBodyCosmetic=this.player.getPlayer().getCosmeticsState().getCosmetics().get(EssentialCosmeticSlot.FULL_BODY);
if(fullBodyCosmetic==="DRAGON_ONESIE_2"){
let cosmetic=this.player.getPlayer().getCosmeticsState().getModels().get(Essential.instance.getConnectionManager().getCosmeticsManager().getCosmetic(fullBodyCosmetic));
if(cosmetic){
let model=cosmetic.getModel().getModel();

let bones=model.getBones(model.getRootBone());

bones.forEach((b)=>{
if(b.boxName==="wing_left_1"||b.boxName==="wing_right_1"){
setField(b,"showModel",false);

this.parent.hiddenEssentialCosmetics.push(b);
}
});
}
}
}
}

updateIfNotRendering(){
let verticleSpeed=this.player.getPlayer()["field_70163_u"]-this.player.getPlayer()["field_70137_T"];

this.flying=verticleSpeed>-0.2&&!this.player.getPlayer()["field_70122_E"];

let timeSince=(Date.now()-this.lastRender)/1000;

if(timeSince<0.02){
return;
}

this.lastRender=Date.now();

let horisontalSpeed=Math.hypot(this.player.getPlayer()["field_70165_t"]-this.player.getPlayer()["field_70142_S"],this.player.getPlayer()["field_70161_v"]-this.player.getPlayer()["field_70136_U"]);


this.animOffset+=Math.min(1,horisontalSpeed)*10*timeSince+1*timeSince;

if(this.player.getPlayer()["field_70172_ad"]>0){
this.animOffset+=5*timeSince;
}



if(this.flying){
this.animOffset+=5*timeSince;

if(verticleSpeed>0){
this.animOffset+=verticleSpeed*25*timeSince;
}
}
if(verticleSpeed<-0.5){
this.animOffset+=(verticleSpeed+0.5)*-3*timeSince;
}

if(horisontalSpeed<0.01){
if(!this.flying){
let amt=(this.animOffset+Math.PI/2)%(20*Math.PI);
if(amt<1*Math.PI){
this.animOffset+=2*timeSince*Math.min(1,amt/(1*Math.PI)*2);
}else if(amt<2*Math.PI){
this.animOffset+=2*timeSince*Math.min(1,(1-(amt/(1*Math.PI)-1))*2);
}
}
}
}}


export default DragonWings;


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