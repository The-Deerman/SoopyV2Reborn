export default class JavaClassWrapperThingo{
constructor(wrappedClass){
this.wrappedClass=wrappedClass;

this.methods=new Map;
}






getMethod(method,args=[]){
if(this.methods.has(method))return this.methods.get(method);

let m=this.wrappedClass.getMethod(method,...args);
m.setAccessible(true);

this.methods.set(method,this._callMethodFun(m));
return this.methods.get(method);
}

_callMethodFun(m){
return function(...args){
return m.invoke(...args);
};
}}