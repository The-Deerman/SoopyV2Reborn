
import Pet from"../pet.js";
import renderLibs from"../../../../../../guimanager/renderLibs.js";
import{drawBoxAtBlock}from"../../../../../utils/renderUtils.js";
import{basiclyEqual}from"../../../../../utils/numberUtils.js";
import TRAVELING_TO_POSITION from"./AiStateHandlers/TRAVELING_TO_POSITION.js";
import{AI_STATE,ANIMATION_STATE}from"./states.js";
import STANDING from"./AiStateHandlers/STANDING.js";
import FLIPPING from"./AiStateHandlers/FLIPPING.js";

const ModelDragon=Java.type("net.minecraft.client.model.ModelDragon");

let dragon=new ModelDragon(0);
let textures=new Map;
let loadingTextures=new Set;
function loadTexture(id){
new Thread(()=>{
loadingTextures.add(id);
textures.set(id,renderLibs.getImage("https://soopy.dev/api/soopyv2/textures/cosmetic/pet/dragon/"+id+"/img.png",true));
}).start();
}
loadTexture("classic");

let head=getField(dragon,"field_78221_a");
let spine=getField(dragon,"field_78219_b");
let jaw=getField(dragon,"field_78220_c");
let body=getField(dragon,"field_78217_d");
let rearLeg=getField(dragon,"field_78218_e");
let frontLeg=getField(dragon,"field_78215_f");
let rearLegTip=getField(dragon,"field_78216_g");
let frontLegTip=getField(dragon,"field_78226_h");
let rearFoot=getField(dragon,"field_78227_i");
let frontFoot=getField(dragon,"field_78224_j");
let wing=getField(dragon,"field_78225_k");
let wingTip=getField(dragon,"field_78222_l");

class DragonPet extends Pet{
constructor(player,parent){
super(player,parent,"dragon");

this.x=this.lastX=player.getX();
this.y=this.lastY=player.getY();
this.z=this.lastZ=player.getZ();

this.lastPositions=[];

this.yaw=this.lastYaw=player.getYaw();

this.aiState=AI_STATE.STANDING;

this.travelToPosition=undefined;

this.following=undefined;
this.followingCache=undefined;
this.followingCacheUpdated=0;

this.nextIsFlip=false;

this.ticks=0;

if(!textures.has(this.settings.texture)&&!loadingTextures.has(this.settings.texture)){
loadTexture(this.settings.texture);
}
}

get followingPlayer(){
if(Date.now()-this.followingCacheUpdated<1000)return this.followingCache;

this.followingCache=this.player;

if(this.following){
let p=getPlayerFromName(this.following);
if(p)this.followingCache=p;
}
this.followingCacheUpdated=Date.now();

return this.followingCache;
}

onRenderEntity(ticks,isInGui){
if(isInGui)return;

this.render(ticks,this.settings.scale);
}

onCommand(option,...args){
if(!option){
ChatLib.chat("valid options: 'flip' 'come' 'goto <x> <y> <z>'");
return;
}
if(option==="come"){
this.travelToPosition=[Player.getX(),Player.getY(),Player.getZ()];
this.aiState=AI_STATE.TRAVELING_TO_POSITION;

ChatLib.chat("derg pet coming to current location!");
return;
}
if(option==="tp"){
this.x=Player.getX();
this.y=Player.getY();
this.z=Player.getZ();

ChatLib.chat("derg pet tpiong to current location!");
return;
}
if(option==="goto"){
let[x,y,z]=args;

if(!y){
let p=getPlayerFromName(x);
if(!p){
ChatLib.chat("invalid username!");
return;
}
x=p.getX();
y=p.getY();
z=p.getZ();
}

this.travelToPosition=[parseFloat(x),parseFloat(y),parseFloat(z)];
this.aiState=AI_STATE.TRAVELING_TO_POSITION;


ChatLib.chat("derg pet going to "+this.travelToPosition.join(", ")+"!");
return;
}
if(option==="follow"){
this.following=args[0];
ChatLib.chat("Following "+args[0]+"!");
return;
}
if(option==="flip"){
this.nextIsFlip=true;
ChatLib.chat("flip!");
return;
}
ChatLib.chat("unknown option!");



}

render(ticks,scale){
if(!textures.has("classic"))return;
if(textures.get(this.settings.texture||"classic")){

Tessellator.bindTexture(textures.get(this.settings.texture||"classic"));
}else{
Tessellator.bindTexture(textures.get("classic"));
}

let modelScale=0.03;



GlStateManager["func_179094_E"]();

Tessellator.translate(
this.getX()-(Player.getPlayer()["field_70142_S"]+(Player.getPlayer()["field_70165_t"]-Player.getPlayer()["field_70142_S"])*ticks),
this.getY()-(Player.getPlayer()["field_70137_T"]+(Player.getPlayer()["field_70163_u"]-Player.getPlayer()["field_70137_T"])*ticks),
this.getZ()-(Player.getPlayer()["field_70136_U"]+(Player.getPlayer()["field_70161_v"]-Player.getPlayer()["field_70136_U"])*ticks));

Tessellator.colorize(1,1,1,1);

GlStateManager["func_179152_a"](scale,-scale,scale);
Tessellator.rotate(this.getYaw(),0,1,0);
if(this.state===ANIMATION_STATE.FLIPPING){
Tessellator.translate(0,-4*Math.sin(this.getAnimationProg()*Math.PI),0);
Tessellator.rotate(this.getAnimationProg()*360,1,0,0);
}
GlStateManager["func_179129_p"]();

GlStateManager["func_179147_l"]();

GlStateManager["func_179091_B"]();
GlStateManager["func_179094_E"]();

let animationSpeedMultiplier=1;
if(this.state===ANIMATION_STATE.STANDING)animationSpeedMultiplier*=0.1;
let animation_progress=-(animationSpeedMultiplier*Date.now()/1000)%1;

let wingAnimSpeed=1;
if(this.state===ANIMATION_STATE.STANDING)wingAnimSpeed=0.1;
let wingAnimDistance=wingAnimSpeed;
let wing_animation_progress=-wingAnimSpeed*(Date.now()/1000)%1;

jaw["field_78795_f"]=wingAnimSpeed*(Math.sin(animation_progress*Math.PI*2)+1)*0.2;

let l=Math.sin(animation_progress*Math.PI*2-1)+1;
l=(l*l*1+l*2)*0.05;
if(this.state===ANIMATION_STATE.STANDING)l*=0.1;

GlStateManager["func_179137_b"](0,l-2,-3);
GlStateManager["func_179114_b"](l*2,1,0,0);

let spine_xrot=0;
let spine_rotation_scale=1.5;

let ds=this.getMovementOffsets(6,ticks);

let p=this.updateRotations(this.getMovementOffsets(5,ticks)[0]-this.getMovementOffsets(10,this.partialTicks)[0]);
let unknown_animation_progress=this.updateRotations(this.getMovementOffsets(5,ticks)[0]+p/2);

let spine_animation_cycle=animation_progress*Math.PI*2;
let m2=20;
let s=-12;

for(let t=0;t<5;t++){
let es=this.getMovementOffsets(5-t,ticks);
let body_spine_animation_progress=Math.cos(t*0.45+spine_animation_cycle)*0.15;

spine["field_78796_g"]=this.updateRotations(es[0]-ds[0])*Math.PI/180*spine_rotation_scale;
spine["field_78795_f"]=body_spine_animation_progress+(es[1]-ds[1])*Math.PI/180*spine_rotation_scale*5;
spine["field_78808_h"]=-this.updateRotations(es[0]-unknown_animation_progress)*Math.PI/180*spine_rotation_scale;
spine["field_78797_d"]=m2;
spine["field_78798_e"]=s;
spine["field_78800_c"]=spine_xrot;
m2=m2+Math.sin(spine["field_78795_f"])*10;
s=s-Math.cos(spine["field_78796_g"])*Math.cos(spine["field_78795_f"])*10;
spine_xrot=spine_xrot-Math.sin(spine["field_78796_g"])*Math.cos(spine["field_78795_f"])*10;
spine["func_78785_a"](modelScale);
}

head["field_78797_d"]=m2;
head["field_78798_e"]=s;
head["field_78800_c"]=spine_xrot;
let fs=this.getMovementOffsets(0,ticks);
head["field_78796_g"]=this.updateRotations(fs[0]-ds[0])*Math.PI/180*1;
head["field_78808_h"]=-this.updateRotations(fs[0]-unknown_animation_progress)*Math.PI/180*1;
head["func_78785_a"](modelScale);
GlStateManager["func_179094_E"]();



body["field_78808_h"]=0;
body["func_78785_a"](modelScale);

for(let v=0;v<2;++v){
let tempThing=0;
if(this.state===ANIMATION_STATE.STANDING)tempThing=1;

let flap_animation_cycle=wing_animation_progress*Math.PI*2;
wing["field_78795_f"]=0.125-Math.cos(flap_animation_cycle)*0.2;
wing["field_78796_g"]=0.25;
wing["field_78808_h"]=(Math.sin(flap_animation_cycle)+0.125)*0.8*wingAnimDistance+0.3*tempThing;

wingTip["field_78808_h"]=-((Math.sin(flap_animation_cycle+2.25)+0.5)*wingAnimDistance)*0.75+0.3-0.5*tempThing;

rearLeg["field_78795_f"]=1+l*0.1;
rearLegTip["field_78795_f"]=0.5+l*0.1;

rearFoot["field_78795_f"]=0.75+l*0.1;
frontLeg["field_78795_f"]=1.3+l*0.1;
frontLegTip["field_78795_f"]=-0.5-l*0.1;
frontFoot["field_78795_f"]=0.75+l*0.1;
wing["func_78785_a"](modelScale);
frontLeg["func_78785_a"](modelScale);
rearLeg["func_78785_a"](modelScale);
GlStateManager["func_179152_a"](-1,1,1);
}

GlStateManager["func_179121_F"]();


let spine_animation_progress=-Math.sin(animation_progress*Math.PI*2)*0;
spine_animation_cycle=animation_progress*Math.PI*2;
m2=10;
s=60;
spine_xrot=0;
ds=this.getMovementOffsets(11,ticks);



for(let x=0;x<12;++x){
fs=this.getMovementOffsets(12+x,ticks);
spine_animation_progress=spine_animation_progress+Math.sin(x*0.45+spine_animation_cycle)*0.05000000074505806;
spine["field_78796_g"]=(this.updateRotations(fs[0]-ds[0])*spine_rotation_scale+180)*Math.PI/180;
spine["field_78795_f"]=spine_animation_progress+(fs[1]-ds[1])*Math.PI/180*spine_rotation_scale*5;
spine["field_78808_h"]=this.updateRotations(fs[0]-unknown_animation_progress)*Math.PI/180*spine_rotation_scale;
spine["field_78797_d"]=m2;
spine["field_78798_e"]=s;
spine["field_78800_c"]=spine_xrot;
m2=m2+Math.sin(spine["field_78795_f"])*10;
s=s-Math.cos(spine["field_78796_g"])*Math.cos(spine["field_78795_f"])*10;
spine_xrot=spine_xrot-Math.sin(spine["field_78796_g"])*Math.cos(spine["field_78795_f"])*10;
spine["func_78785_a"](modelScale);
}

GlStateManager["func_179121_F"]();
GlStateManager["func_179084_k"]();
GlStateManager["func_179121_F"]();
}

updateRotations(d){
d=d%360;

while(d>=180){
d-=360;
}

while(d<-180){
d+=360;
}

return d;
}

getMovementOffsets(dist,ticks){
return this.lastPositions[dist]?[this.getX()-this.lastPositions[dist][0],this.getY()-this.lastPositions[dist][1]]:[0,0];
}

onTick(){
this.lastPositions.push([this.getX(),this.getZ()]);
if(this.lastPositions.length>64)this.lastPositions.shift();

if(!this.isSelfPlayer)return;

this.ticks++;
if(this.ticks%5!==0)return;
this.preUpdate();












switch(this.aiState){
case AI_STATE.TRAVELING_TO_POSITION:
TRAVELING_TO_POSITION(this);
break;
case AI_STATE.STANDING:
STANDING(this);
break;
case AI_STATE.FLIPPING:
FLIPPING(this);
break;}





























































this.postUpdate();


}}





export default DragonPet;

function getField(e,field){

let field2=e.class.getDeclaredField(field);

field2.setAccessible(true);

return field2.get(e);
}

function getPlayerFromName(name){
for(let player of World.getAllPlayers()){
if(player.getName().toLowerCase()===name.toLowerCase())return player;
}
}