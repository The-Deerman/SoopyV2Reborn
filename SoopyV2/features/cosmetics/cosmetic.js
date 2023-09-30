
class Cosmetic{
constructor(player,parent,id){

if(player.getUUID().toString()===Player.getUUID().toString())player=Player;



this.player=player;

this.parent=parent;

this.id=id;

this.settings=this.parent.getPlayerCosmeticSettings(this.player,id);

this.onTick();
}

onCommand(...args){

}

get isSelfPlayer(){
return this.player.getUUID().toString()===Player.getUUID().toString();
}

onCosmeticMessage(data){

}

onRenderEntity(ticks,isInGui){

}

onTick(){

}

sendCosmeticsData(data){
this.parent.sendCosmeticsData(this.id,data);
}

removeEssentialCosmetics(){}}


export default Cosmetic;