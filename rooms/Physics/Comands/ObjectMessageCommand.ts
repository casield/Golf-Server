import { c } from "../../../c";
import { BoxObject, ObjectMessage, SphereObject } from "../../../schema/GameRoomState";
import { QuixPhysicsRoom } from "../../QuixPhysicsRoom";
import { CommandParams, ICommand } from "./Comands";

export class ObjectMessageCommand<T extends string> implements ICommand<T>{
    name = "objectMessage";
    constructor (public room:QuixPhysicsRoom){

    }
    onRoomMessage?(params: T): void {
       // this.room.phyController?.Send(this.name, params);
    }
    onPhyMessage?(params: T): void {

        var dataObj = JSON.parse(params);
        var om = new ObjectMessage();
        om.uID = dataObj.uID;
        om.message = dataObj.data;
        this.room.broadcast("objectMessage", om);
    }
}