import PhysicsController from "../PhysicsController";
import { OVarActions, OVarsManager } from "./OVarsManager";

enum OVarTypes {
    "string",
    "dobule",
}




export default class OVar{
    public value?: any
    onChangeListeners: Function[] = new Array();
    constructor(public name:string,public defaultValue:any,public manager: OVarsManager) {
        manager.addOVarToPhy(this);
    }
    update(val: any) {
        this.manager.SendAction(OVarActions.update,this,val)
        //Send the change throw network
    }
    addChangeListener(listener:Function){
        
        this.onChangeListeners.push(listener);
    }
    onUpdate(newVal:any){
        this.value = newVal;
    }


}