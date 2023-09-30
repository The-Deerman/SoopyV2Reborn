import fetch from"../../../SoopyV2/utils/networkUtils";import Promise from"../../../PromiseV2";

import SoopyTextElement from"../../../guimanager/GuiElement/SoopyTextElement";
import Feature from"../../featureClass/class";
import GuiPage from"../soopyGui/GuiPage";
import BoxWithLoading from"../../../guimanager/GuiElement/BoxWithLoading";
import BoxWithTextAndDescription from"../../../guimanager/GuiElement/BoxWithTextAndDescription";
import SoopyGuiElement from"../../../guimanager/GuiElement/SoopyGuiElement";
import PasswordInput from"../../../guimanager/GuiElement/PasswordInput";
import SoopyKeyPressEvent from"../../../guimanager/EventListener/SoopyKeyPressEvent";
import{numberWithCommas}from"../../utils/numberUtils";
import{firstLetterWordCapital}from"../../utils/stringUtils";
import SoopyBoxElement from"../../../guimanager/GuiElement/SoopyBoxElement";
import SoopyMarkdownElement from"../../../guimanager/GuiElement/SoopyMarkdownElement";
import SoopyMouseClickEvent from"../../../guimanager/EventListener/SoopyMouseClickEvent";
import ButtonWithArrow from"../../../guimanager/GuiElement/ButtonWithArrow";
import Dropdown from"../../../guimanager/GuiElement/Dropdown";
import SoopyContentChangeEvent from"../../../guimanager/EventListener/SoopyContentChangeEvent";

let allowed=new Set(["dc8c39647b294e03ae9ed13ebd65dd29","83c5626ede2d4754b86064d558809615"]);

class SuggestionGui extends Feature{
constructor(){
super();
}

onEnable(){
this.initVariables();

this.GuiPage=new SuggestionPage;

}

initVariables(){
this.GuiPage=undefined;
}

onDisable(){
this.initVariables();
}}



class SuggestionPage extends GuiPage{
constructor(){
super(7);

this.name="Suggestions";

this.pages=[this.newPage()];

this.password="";

if(allowed.has(Player.getUUID().toString().replace(/-/g,""))){
let elm=new PasswordInput().setPlaceholder("Suggestions").setLocation(0.125,0.05,0.3,0.1);
this.pages[0].addChild(elm);

elm.addEvent(new SoopyKeyPressEvent().setHandler((key,keyId)=>{
if(elm.text.selected&&keyId===28){
this.password=elm.text.text;
elm.setText("");
elm.text.selected=false;
}
}));
}else{
this.pages[0].addChild(new SoopyTextElement().setText("\xA70Suggestions").setMaxTextScale(3).setLocation(0.125,0.05,0.3,0.1));
}

let button=new ButtonWithArrow().setText("\xA70Suggest feature (Opens in browser)").setLocation(0.45,0.05,0.5,0.1);
this.pages[0].addChild(button);

button.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
java.awt.Desktop.getDesktop().browse(
new java.net.URI("https://soopy.dev/soopyv2suggestion?uuid="+Player.getUUID().toString().replace(/-/g,"")));

}));

this.suggestionElements={};

this.suggestionsArea=new SoopyGuiElement().setLocation(0.05,0.2,0.9,0.8).setScrollable(true);
this.pages[0].addChild(this.suggestionsArea);


fetch("https://soopy.dev/api/soopyv2/suggestionTags.json").json().then((data)=>{
this.tags=data;
});

this.finaliseLoading();
}

loadSuggestionPage(){return Promise.resolve().then(()=>{return(
fetch("https://soopy.dev/api/soopyv2/suggestion/new").json())}).then((_resp)=>{let data=_resp;

this.suggestionElements={};
this.suggestionsArea.clearChildren();

let i=0;

data.suggestions.forEach((suggestion)=>{

if(suggestion.status==="pending_review"||suggestion.status==="closed"){
if(suggestion.uuid!==Player.getUUID().toString().replace(/-/g,"")&&!allowed.has(Player.getUUID().toString().replace(/-/g,"")))return;
}

let box=new SoopyBoxElement().setLocation(0,0.175*i,1,0.15).setLore(["Click for more information + vote buttons"]);
this.suggestionsArea.addChild(box);

let title=new SoopyTextElement().setText("\xA70"+suggestion.title+" \xA77("+this.tags.suggestionTags[suggestion.tag]+")").setMaxTextScale(2).setLocation(0,0,0.8,1);
box.addChild(title);

let popularity=new SoopyTextElement().setText("\xA70Opinion: "+numberWithCommas(suggestion.likes-suggestion.dislikes)).setMaxTextScale(2).setLocation(0.85,0,0.1,1);
box.addChild(popularity);

this.suggestionElements[suggestion._id]={
title:title,
popularity:popularity};


box.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
this.loadSuggestion(suggestion._id);
}));

i++;
})})}


loadSuggestion(id){return Promise.resolve().then(()=>{return(
fetch("https://soopy.dev/api/soopyv2/suggestion/"+id+"/user/"+Player.getUUID().toString().replace(/-/g,"")).json())}).then((_resp)=>{let data=_resp;
let sideBarElm=new SoopyGuiElement().setLocation(0,0,1,1).setScrollable(true);
if(!data.success){
sideBarElm.addChild(new SoopyTextElement().setText("\xA7cError loading suggestion").setMaxTextScale(3).setLocation(0.5,0.5,0.5,0.5));
this.openSidebarPage(sideBarElm);

}else{

this.suggestionElements[id].title.setText("\xA70"+data.suggestion.title+" \xA77("+this.tags.suggestionTags[data.suggestion.tag]+")");
this.suggestionElements[id].popularity.setText("\xA70Opinion: "+numberWithCommas(data.suggestion.likes-data.suggestion.dislikes));


let title=new SoopyTextElement().setText("\xA70"+data.suggestion.title+" \xA77("+this.tags.suggestionTags[data.suggestion.tag]+")").setMaxTextScale(2).setLocation(0.05,0.05,0.9,0.1);
sideBarElm.addChild(title);

if(!allowed.has(Player.getUUID().toString().replace(/-/g,""))){
let suggestor=new SoopyTextElement().setText("\xA77Suggested by "+data.suggestion.username+" | Status: "+this.tags.statusTags[data.suggestion.status]).setMaxTextScale(1).setLocation(0.05,0.15,0.9,0.05);
sideBarElm.addChild(suggestor);
}else{
let suggestor=new SoopyTextElement().setText("\xA77Suggested by "+data.suggestion.username+" | Status: ").setMaxTextScale(1).setLocation(0.05,0.15,0.6,0.05);
sideBarElm.addChild(suggestor);

let drop=new Dropdown().setLocation(0.65,0.13,0.3,0.09).setOptions({...this.tags.statusTags,"delete":"Delete"}).setSelectedOption(data.suggestion.status);
sideBarElm.addChild(drop);

drop.addEvent(new SoopyContentChangeEvent().setHandler((newVal)=>{
if(newVal==="delete"){
fetch("https://soopy.dev/api/soopyv2/suggestion/"+id+"/delete/"+this.password).load();

this.loadSuggestionPage();
this.closeSidebarPage();
return;
}
fetch("https://soopy.dev/api/soopyv2/suggestion/"+id+"/status/"+newVal+"/"+this.password).load();

this.loadSuggestion(id);
}));
}

let likesText=new SoopyTextElement().setText("\xA70Dislikes: "+numberWithCommas(data.suggestion.dislikes)+" Likes: "+numberWithCommas(data.suggestion.likes)).setMaxTextScale(1).setLocation(0.35,0.225,0.3,0.1);
sideBarElm.addChild(likesText);
if(!data.suggestion.hasDisliked){
let dislikeButton=new ButtonWithArrow().setDirectionRight(false).setText("\xA7cDislike").setLocation(0.05,0.225,0.275,0.1);
sideBarElm.addChild(dislikeButton);
dislikeButton.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
this.voteSuggestion(id,"dislike");
}));
}else{
let dislikeButton=new ButtonWithArrow().setDirectionRight(false).setText("\xA7cUndislike").setLocation(0.05,0.225,0.275,0.1);
sideBarElm.addChild(dislikeButton);
dislikeButton.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
this.voteSuggestion(id,"clear");
}));
}
if(!data.suggestion.hasLiked){
let likeButton=new ButtonWithArrow().setText("\xA7aLike").setLocation(0.675,0.225,0.275,0.1);
sideBarElm.addChild(likeButton);
likeButton.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
this.voteSuggestion(id,"like");
}));
}else{
let likeButton=new ButtonWithArrow().setText("\xA7aUnlike").setLocation(0.675,0.225,0.275,0.1);
sideBarElm.addChild(likeButton);
likeButton.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
this.voteSuggestion(id,"clear");
}));
}


let description=new SoopyMarkdownElement().setText(data.suggestion.description).setLocation(0.05,0.325,0.9,0.6);
sideBarElm.addChild(description);

this.openSidebarPage(sideBarElm)}})}


voteSuggestion(id,type){
fetch("https://soopy.dev/api/soopyv2/suggestion/"+id+"/vote/"+type+"/"+Player.getUUID().toString().replace(/-/g,"")).load();

this.loadSuggestion(id);
}

onOpen(){
this.loadSuggestionPage();
}}


module.exports={
class:new SuggestionGui};