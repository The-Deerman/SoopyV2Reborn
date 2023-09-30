import Cosmetic from"../../cosmetic.js";

class Pet extends Cosmetic{
constructor(player,parent,petType){
super(player,parent,"pet_"+petType);

this.x=0;
this.y=0;
this.z=0;
this.yaw=0;
this.headYaw=0;

this.state=0;

this.lastX=0;
this.lastY=0;
this.lastZ=0;
this.lastYaw=0;
this.lastHeadYaw=0;

this.lastState=0;

this.lastUpdate=Date.now();
}

onCosmeticMessage(data){
if(this.isSelfPlayer)return;
if(data[0]!==0)return;


this.preUpdate();
let _;
[_,this.x,this.y,this.z,this.yaw,this.headYaw,this.state]=data;
this.postUpdate();
}







getAnimationProg(){
return Math.min(1,(Date.now()-this.lastUpdate)/250);
}

getX(){
return this.x*this.getAnimationProg()+this.lastX*(1-this.getAnimationProg());
}

getY(){
return this.y*this.getAnimationProg()+this.lastY*(1-this.getAnimationProg());
}

getZ(){
return this.z*this.getAnimationProg()+this.lastZ*(1-this.getAnimationProg());
}

getYaw(){
let[direction,distance]=calculateYawDirection(this.lastYaw,this.yaw);

return(this.lastYaw+distance*direction*this.getAnimationProg()+360)%360;
}

getHeadYaw(){
let[direction,distance]=calculateYawDirection(this.lastHeadYaw,this.headYaw);

return(this.lastHeadYaw+distance*direction*this.getAnimationProg()+360)%360;
}







getYawToLocation(x,z){
let yaw=Math.atan((x-this.x)/(z-this.z))/(Math.PI*2)*360;
if(z>this.z)yaw+=180;

if(isNaN(yaw))return this.yaw;

return(yaw+360)%360;
}










getDistanceTo(x,y=null,z=null){
if(y===null)return Math.abs(this.y-x);

if(z===null)return Math.hypot(this.x-x,this.z-y);

return Math.hypot(this.x-x,this.y-y,this.z-z);
}










moveTowards(x,z,distance=null){
if(distance===null){


if(Math.abs(this.y-x)<z){
this.y=x;
return;
}

if(this.y<x)this.y+=z;else
this.y-=z;

return;
}


let yaw=this.getYawToLocation(x,z);
let distanceFinal=(this.x-x)**2+(this.z-z)**2;

if(distanceFinal<distance**2){
this.x=x;
this.z=z;
return;
}

this.yaw=yaw;

let xDist=Math.abs(distance*Math.sin(yaw/180*Math.PI));
let zDist=Math.abs(distance*Math.cos(yaw/180*Math.PI));

if(this.x>x)xDist*=-1;
if(this.z>z)zDist*=-1;

this.x+=xDist;
this.z+=zDist;
}







getYawToYaw(yaw){
return calculateYawDirection(this.yaw,yaw)[1];
}






rotateTowards(yaw,speed){
let[direction,distance]=calculateYawDirection(this.yaw,yaw);

if(distance<speed){
this.yaw=yaw;
return;
}

let newYaw=this.yaw+speed*direction;

this.yaw=(newYaw+360)%360;
}

preUpdate(){
this.lastX=this.getX()||0;
this.lastY=this.getY()||0;
this.lastZ=this.getZ()||0;
this.lastYaw=this.getYaw()||0;
this.lastState=this.state;
}

postUpdate(){
this.lastUpdate=Date.now();

if(this.isSelfPlayer)
this.sendCosmeticsData([0,this.x,this.y,this.z,this.yaw,this.headYaw,this.state]);
}}

export default Pet;

function calculateYawDirection(c,n){
let direction=1;
let distance=Math.abs(n-c);
if(c>n){
direction=-1;
if(distance>Math.abs(n-c+360)){
direction=1;
distance=Math.abs(n-c+360);
}
}
if(c<n){
direction=1;
if(distance>Math.abs(n-c-360)){
direction=-1;
distance=Math.abs(n-c-360);
}
}
return[direction,distance];
}