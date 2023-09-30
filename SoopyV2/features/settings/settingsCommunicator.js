



class SettingsCommunicator{
constructor(){
this.settings={};
}

addSetting(module,settingID,settingObject){
if(!this.settings[module])this.settings[module]={};

this.settings[module][settingID]=settingObject;
}
removeSetting(module,settingID){
if(!this.settings[module])return;
delete this.settings[module][settingID];
}
getSetting(module,settingID){
return this.settings[module][settingID];
}
getModuleSettings(module){
return Object.values(this.settings[module]||[]);
}}


if(!global.soopyv2SettingsCommunicator){
global.soopyv2SettingsCommunicator=new SettingsCommunicator;

register("gameUnload",()=>{
global.soopyv2SettingsCommunicator=undefined;
});
}

export default global.soopyv2SettingsCommunicator;