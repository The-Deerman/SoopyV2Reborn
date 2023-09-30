import{AI_STATE,ANIMATION_STATE}from"../states.js";





export default function(pet){
let yawToPosition=pet.getYawToLocation(pet.travelToPosition[0],pet.travelToPosition[2]);

if(pet.getYawToYaw(yawToPosition)>50){



pet.state=ANIMATION_STATE.STANDING;

pet.rotateTowards(yawToPosition,50);
}else{
let hDistToPosition=pet.getDistanceTo(pet.travelToPosition[0],pet.travelToPosition[2]);
let vDistToPosition=pet.getDistanceTo(pet.travelToPosition[1]);

if(hDistToPosition+vDistToPosition<1){

pet.aiState=AI_STATE.STANDING;

pet.state=ANIMATION_STATE.FLYING;
if(World.getBlockAt(pet.x,pet.y-1,pet.z).getType().getID()){
pet.state=ANIMATION_STATE.STANDING;
}
}else{



let hSpeed=Math.min(10,hDistToPosition+2)/5;
let vSpeed=Math.min(20,vDistToPosition+2)/10;

pet.moveTowards(pet.travelToPosition[0],pet.travelToPosition[2],hSpeed);
pet.moveTowards(pet.travelToPosition[1],vSpeed);

pet.state=ANIMATION_STATE.FLYING;
if(World.getBlockAt(pet.x,pet.y-1,pet.z).getType().getID()){
pet.state=ANIMATION_STATE.WALKING;
}
}
}
}