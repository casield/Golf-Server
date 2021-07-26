
import { Dictionary } from "lodash";
import { Socket } from "net";
import PhysicsController from "../PhysicsController";
import OVar from "./OVar";

export enum OVarActions {
    "update" = "up",
    "add" = "add"
}

export interface OVarMessage {
    a: OVarActions,
    i: string;
    v: any;
}

export class OVarsManager {

    private ovars: Map<string, OVar> = new Map();

    constructor(public phyController: PhysicsController) {

    }

    public addOVarToPhy(ovar: OVar) {
        this.SendAction(OVarActions.add, ovar, ovar.value);
        this.ovars.set(ovar.name, ovar);
    }
    public SendAction(action: OVarActions, ovar: OVar, newVal: any) {
        let ms: OVarMessage = { a: action, i: ovar.name, v: newVal }
        this.phyController.Send("OVar", ms);
    }
    public onMessage(message: OVarMessage) {
        if (message.a == OVarActions.add) {

        }
        if (message.a == OVarActions.update) {
            let ov: OVar = this.ovars.get(message.i) as OVar;
            
            if (ov != undefined) {

                ov.onUpdate(message.v);
                ov.onChangeListeners.forEach(element => {
                    element();
                });
            }else{
                console.error("Couldn't find OVar ",message);
            }

        }
    }

}