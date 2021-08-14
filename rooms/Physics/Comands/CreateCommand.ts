import { c } from "../../../c";
import { BoxObject, SphereObject } from "../../../schema/GameRoomState";
import { QuixPhysicsRoom } from "../../QuixPhysicsRoom";
import { CommandParams, ICommand } from "./Comands";

export class CreateCommand<T extends string> implements ICommand<T>{
    name = "create";
    constructor (public room:QuixPhysicsRoom){

    }
    onRoomMessage?(params: T): void {
       // this.room.phyController?.Send(this.name, params);
    }
    onPhyMessage?(params: T): void {
        let message = JSON.parse(params);
        let position = c.createV3(message.position.X, message.position.Y, message.position.Z);

        let quat = c.createQuat(message.quaternion.X, message.quaternion.Y, message.quaternion.Z, message.quaternion.W);
        let boxState;
        if ("halfSize" in message) {
            let halfSize = c.createV3(message.halfSize.X, message.halfSize.Y, message.halfSize.Z);
            boxState = new BoxObject().assign({
                halfSize: halfSize,
                position: position,
                quaternion: quat,
                type: message.type,
                mass: message.mass,
                mesh: message.mesh,
                uID: message.uID,
                isMesh:message.isMesh

            });
        }
        if ("radius" in message) {
            boxState = new SphereObject().assign({
                radius: message.radius,
                position: position,
                quaternion: quat,
                type: message.type,
                mass: message.mass,
                mesh: message.mesh,
                uID: message.uID,
            });
        }
        if (message.owner != undefined && boxState) {
            boxState.owner = message.owner;
        }
        //console.log("Create box",boxState.type);
        if (boxState) {
            this.room?.State?.world.objects.set(message.uID, boxState);
        }
    }


}