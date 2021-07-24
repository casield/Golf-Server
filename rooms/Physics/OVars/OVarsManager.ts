
import { Socket } from "net";
import OVar from "./OVar";

export enum OVarActions{
    "update"="up",
}

interface OVarMessage<T>{
    a:OVarActions,
    o:OVar<T>;
    v:T;
}

export class OVarsManager{

    private ovars:OVar<any>[] = []

    constructor(public socket:Socket){
        
    }

    public addOVar(ovar:OVar<any>){
      return  this.ovars.push(ovar);
    }
    public SendAction<T>(action:OVarActions,ovar:OVar<T>,newVal:T){
        let ms:OVarMessage<T> = {a:action,o:ovar,v:newVal}
        this.socket.write(JSON.stringify(ms))
    }

}