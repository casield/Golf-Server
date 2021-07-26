import { QuixPhysicsRoom } from "../../QuixPhysicsRoom";
import { OVarMessage } from "../OVars/OVarsManager";
import { ICommand } from "./Comands";

export class OVarCommand implements ICommand<string>{
    name: string = "OVar";

    public constructor(public room:QuixPhysicsRoom){

    }

    onPhyMessage?(params:string){
       // console.log("Phyyyy")
       let ov:OVarMessage = JSON.parse(params);
        this.room.phyController?.oVarsManager?.onMessage(ov);
    }

}