

import Feature from"../../featureClass/class";
import SettingBase from"../settings/settingThings/settingBase";
import ToggleSetting from"../settings/settingThings/toggle";

class Performance extends Feature{
constructor(){
super();
}

onEnable(){
return;
new SettingBase("NOTE: If you dont use any of the features, disable this","Having performance enabled will decrease performance if no features are used\n(this is due to it using the render entity event)",true,"hide_performance_description",this);

this.armourStandCapSetting=new ToggleSetting("Armorstand render cap","Limits the max number of armor stands rendered to 50\n(50 closest to player)",true,"armorstand_render_cap",this);

this.entitysRenderingTemp={};
this.entitysRendering={};

this.dontRender={};



this.nextUpdateDontRender=0;
this.maxEntsRender=50;
this.armourstandClass=Java.type("net.minecraft.entity.item.EntityArmorStand").class;
this.armourstandClassString=this.armourstandClass.toString();

this.registerStep(true,5,this.updateDontRender);

this.registerEvent("renderEntity",this.renderEntity);
this.registerEvent("renderWorld",this.renderWorld);


}












renderWorld(){
if(!this.armourStandCapSetting.getValue())return;
this.entitysRendering={};
Object.keys(this.entitysRenderingTemp).forEach((a)=>{
this.entitysRendering[a]=true;
});
this.entitysRenderingTemp={};
}

updateDontRender(){
if(!this.armourStandCapSetting.getValue())return;







let start=Date.now();
if(start<this.nextUpdateDontRender)return;
let entities=World.getAllEntitiesOfType(this.armourstandClass);
let Ents=new Array(100);
for(let i=0;i<entities.length;i++){

if(!this.entitysRendering[entities[i].getUUID().toString()]){
delete this.dontRender[entities[i].getUUID().toString()];
continue;
}

let dist=(Player.getX()-entities[i].getX())**2+(Player.getY()-entities[i].getY())**2+(Player.getZ()-entities[i].getZ())**2;
if(dist>100**2){
this.dontRender[entities[i].getUUID().toString()]=true;
continue;
}

dist=~~Math.sqrt(dist);
Ents[dist]=[entities[i],Ents[dist]];
}

let entsNumber=0;
for(let i=0;i<Ents.length;i++){
let entsNumberTemp=entsNumber;
while(Ents[i]){
if(entsNumber>this.maxEntsRender){
this.dontRender[Ents[i][0].getUUID().toString()]=true;
}else{
delete this.dontRender[Ents[i][0].getUUID().toString()];
}

Ents[i]=Ents[i][1];
entsNumberTemp++;
}
entsNumber=entsNumberTemp;
}
let timeTook=Date.now()-start;

this.nextUpdateDontRender=Date.now()+100+10*timeTook;



}

renderEntity(e,pos,ticks,event){
if(!this.armourStandCapSetting.getValue())return;
if(!e.getEntity().class.toString()===this.armourstandClassString)return;
this.entitysRenderingTemp[e.getUUID().toString()]=true;
if(this.dontRender[e.getUUID().toString()]){
cancel(event);
return;
}
}

onDisable(){
this.running=false;
}}


module.exports={
class:new Performance};