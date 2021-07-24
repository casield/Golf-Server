
import { number } from "@colyseus/schema/lib/encoding/decode";
import Ajv, { JSONSchemaType } from "ajv";
import { Room } from "colyseus";
import { identity } from "lodash";
import { QuixPhysicsRoom } from "../../QuixPhysicsRoom";

export interface ICommand<Type extends CommandParams> {

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
const ajv = new Ajv()
export class MoveCommand extends Command<MoveCommandParams>{

    constructor(room: QuixPhysicsRoom) {
        super("move",room);
    }
    onPhyMessage?(params: CommandParams): void {
        throw new Error("Method not implemented.");
    }
    validate(params:any){
       /* const schema: JSONSchemaType<MoveCommandParams> = {
            type: "object",
            properties: {},
            required: ["clientId","roomId","x","y"],
            additionalProperties: true
          }
          const validate2 = ajv.compile(schema);

          console.log("Validate",validate2(params));*/
    }

    onRoomMessage(params: MoveCommandParams): void {
        console.log("Sending", params)
        this.validate(params);
        this.room.phyController?.Send(this.name, params);
    }
}
