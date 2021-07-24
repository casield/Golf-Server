import { Room } from "colyseus";
import { identity } from "lodash";
import { QuixPhysicsRoom } from "../../QuixPhysicsRoom";
import PhysicsController from "../PhysicsController";
import { ICommand, CommandParams, MoveCommand, MoveCommandParams, Command } from "./Comands";

export enum ContextTypes {
    "room", "phy"
}
export class CommandReader {
    public commads: Map<string, Command<CommandParams>> = new Map();
    constructor(public room: QuixPhysicsRoom) {
        this.addCommand(new Command("move",room));
        this.addCommand(new Command("jump",room));
        this.addCommand(new Command("shoot",room));
        this.addCommand(new Command("gauntlet",room));
        this.addCommand(new Command("swipe",room));
        this.addCommand(new Command("createBoxes",room));
        this.addCommand(new Command("rotate",room));
    }

    public addCommand(command: Command<CommandParams>) {
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