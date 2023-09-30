import fetch from"../../../SoopyV2/utils/networkUtils";import Promise from"../../../PromiseV2";class HelpDataLoader{
constructor(){
this.availableHelpData={};
this.dataCach={};

fetch("https://soopy.dev/api/soopyv2/settingshelpoptions.json").json().then((data)=>{
Object.keys(data).forEach((category)=>{
this.availableHelpData[category]=new Set(data[category]);
});
});
}

hasData(category,id){
return this.availableHelpData[category]&&this.availableHelpData[category].has(id);
}

getData(category,id){return Promise.resolve().then(()=>{return(()=>{
if(!this.hasData(category,id)){
return"";
}else{return(()=>{return(()=>{

if(this.dataCach[category]&&this.dataCach[category][id]){
return this.dataCach[category][id];
}else{return Promise.resolve().then(()=>{return(

fetch("https://soopy.dev/api/soopyv2/settingshelp/"+category+"/"+id).text())}).then((_resp)=>{let data=_resp;
if(!this.dataCach[category]){
this.dataCach[category]={};
}

this.dataCach[category][id]=data;

callback(data)})}})()})()}})()}).then(()=>{})}}



if(!global.helpDataLoader){
global.helpDataLoader=new HelpDataLoader;

register("gameUnload",()=>{
global.helpDataLoader=undefined;
});
}

export default global.helpDataLoader;