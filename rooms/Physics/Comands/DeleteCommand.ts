import { QuixPhysicsRoom } from "../../QuixPhysicsRoom";
import { ICommand } from "./Comands";

export class DeleteCommand<T extends string> implements ICommand<T>{
    name = "delete";
    constructor (public room:QuixPhysicsRoom){

    }

    onPhyMessage(params: T){
        console.log("Delete message",params);
        let Json = JSON.parse(params);
        this.room.State?.world.objects.delete(Json.uID);
    }

}