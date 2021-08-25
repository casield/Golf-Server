import { UserState } from "../../../schema/GameRoomState";
import { QuixPhysicsRoom } from "../../QuixPhysicsRoom";
import MessagesVars from "../MessagesVars";
import OVar from "../OVars/OVar";
import { OVarsManager } from "../OVars/OVarsManager";
import { ICommand } from "./Comands";

export class CreateBotCommand<T extends string> implements ICommand<T>{
    name = "createbot";
    constructor (public room:QuixPhysicsRoom){

    }

    onPhyMessage(params: T){
        let us = new UserState();
        let BotID = "Bot";
        us.sessionId = BotID;
        // this.clients.push(client);
        this.room.State?.users.set(BotID, us);
        let gem = new OVar("gems"+BotID,0,this.room.phyController?.oVarsManager as OVarsManager)
        gem.addChangeListener(()=>{
           
            us.gems = gem.value;
        })

        this.room.phyController?.Send(MessagesVars.join, {clientId:us.sessionId});
    }

}