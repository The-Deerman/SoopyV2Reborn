import Promise from"../../../PromiseV2";

import Feature from"../../featureClass/class";
import{uuidFromUsername}from"../../utils/utils";
import{SoopyGui}from"../../../guimanager/";



class PlayerNotes extends Feature{
constructor(){
super();
}

onEnable(){
this.loadedNotes=[];

this.notesGui=new SoopyGui;

this.registerCommand("soopynotes",this.openNotesGui);
this.registerCommand("sn",this.openNotesGui);



}

openNotesGui(){
this.notesGui.open();
}

onDisable(){

}}


module.exports={
class:new PlayerNotes};


class Notes{
constructor(name,canEdit,owner){






this.playerMap=new Map;





this.usernametoUUID=new Map;

this.notesName=name;

this.canEditNotes=canEdit;

this.ownerOfNotes=owner;

this.noteEditId=0;
}




toJSON(){
let data={};

data.notesName=this.notesName;
data.canEditNotes=this.canEditNotes;
data.owner=this.ownerOfNotes;
data.noteEditId=this.noteEditId;

data.playerNotes=[];
this.playerMap.forEach((data,uuid)=>{
data.playerNotes.push([uuid,data]);
});

return data;
}




static fromJSON(data){
let notes=new Notes(data.notesName,data.canEditNotes,data.owner);

notes.noteEditId=data.noteEditId;

for(let dataL of data.playerNotes){
let[uuid,data]=dataL;

notes.playerMap.set(uuid,data);

notes.usernametoUUID.set(data.username.toLowerCase(),uuid);
}

return notes;
}





addPlayerFromUsername(username,note){return Promise.resolve().then(()=>{return(
uuidFromUsername(username))}).then((_resp)=>{let uuid=_resp;
if(!uuid){return false}else{

let playerData=this.playerMap.get(uuid);
if(!playerData){playerData={username:username,usernameUpdated:Date.now(),notes:[]}}

playerData.notes.push([note,Date.now(),Player.getUUID().toString()]);

this.playerMap.set(uuid,playerData);

return true}})}






getNotesFromUuid(uuid){
return this.playerMap.get(uuid);
}





getNotesFromUsernameApi(username){return Promise.resolve().then(()=>{return(
uuidFromUsername(username))}).then((_resp)=>{let uuid=_resp;
if(!uuid){return undefined}else{

return this.playerMap.get(uuid)}})}






getNotesFromUsername(username){
let uuid=this.usernametoUUID.get(username.toLowerCase());
if(!uuid)return undefined;

return this.playerMap.get(uuid);
}}