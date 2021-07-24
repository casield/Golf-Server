import PhysicsController from "../PhysicsController";
import { OVarActions, OVarsManager } from "./OVarsManager";

enum OVarTypes {
    "string",
    "dobule",
}




export default class OVar<T>{
    private value?: T
    public index?: number;
    onChangeListeners?: (newVal: T) => void[];
    constructor(public manager: OVarsManager) {
        this.index = manager.addOVar(this);

    }
    set(val: T) {
        this.manager.SendAction<T>(OVarActions.update,this,val)
        //Send the change throw network
    }


}