
import { number } from "@colyseus/schema/lib/encoding/decode";
import Ajv, { JSONSchemaType } from "ajv";
import { Room } from "colyseus";
import { identity } from "lodash";
import { QuixPhysicsRoom } from "../../QuixPhysicsRoom";
import { OVarMessage } from "../OVars/OVarsManager";

export interface ICommand<Type> {

    room: QuixPhysicsRoom;
    name: string;
    onRoomMessage?(params: Type): void;
    onPhyMessage?(params: Type): void;


}

export interface CommandParams {
    roomId: string;
    clientId: string;
}
export interface MoveCommandParams extends CommandParams {
    x: number, y: number
}

export class Command<T extends CommandParams> implements ICommand<T>{

    constructor (public name:string,public room:QuixPhysicsRoom){

    }
    onRoomMessage?(params: T): void {
        this.room.phyController?.Send(this.name, params);
    }
    onPhyMessage?(params: T): void {
        throw new Error("Method not implemented.");
    }


}

