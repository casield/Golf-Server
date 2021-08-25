import { Room } from "colyseus";
import { identity } from "lodash";
import { QuixPhysicsRoom } from "../../QuixPhysicsRoom";
import PhysicsController from "../PhysicsController";
import { ICommand, CommandParams, MoveCommandParams, Command } from "./Comands";
import { CreateBotCommand } from "./CreateBotCommand";
import { CreateCommand } from "./CreateCommand";
import { DeleteCommand } from "./DeleteCommand";
import { ObjectMessageCommand } from "./ObjectMessageCommand";
import { OVarCommand } from "./OVarCommand";
import { UpdateCommand } from "./UpdateCommand";

export enum ContextTypes {
    "room", "phy"
}
export class CommandReader {
    public commads: Map<string, ICommand<any>> = new Map();
    
    constructor(public room: QuixPhysicsRoom) {
        //Commands from client
        this.addCommand(new Command("move",room));
        this.addCommand(new Command("jump",room));
        this.addCommand(new Command("shoot",room));
        this.addCommand(new Command("gauntlet",room));
        this.addCommand(new Command("swipe",room));
        this.addCommand(new Command("createBoxes",room));
        this.addCommand(new Command("rotate",room));
        this.addCommand(new Command("changeGauntlet",room));

        //QuixPhysics commands

        this.addCommand(new OVarCommand(room));
        this.addCommand(new CreateCommand(room));
        this.addCommand(new DeleteCommand(room));
        this.addCommand(new UpdateCommand(room));
        this.addCommand(new ObjectMessageCommand(room));
        this.addCommand(new CreateBotCommand(room));
    }

    public addCommand(command: ICommand<any>) {
        this.commads.set(command.name, command);
    }

    public execute(name: string, params: CommandParams, context: ContextTypes) {
        if (this.commads.has(name)) {
            let command = this.commads.get(name);
            if (command) {
                if (context == ContextTypes.room && command.onRoomMessage) {
                    command.onRoomMessage(params)
                }
                if (context == ContextTypes.phy && command.onPhyMessage) {
                    command.onPhyMessage(params)
                }
            }
            // command.validate(params);



        } else {
            console.error("The command " + name + " is not registred.")
        }
    }
}