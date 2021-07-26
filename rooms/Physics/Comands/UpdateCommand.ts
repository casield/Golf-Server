import { QuixPhysicsRoom } from "../../QuixPhysicsRoom";
import { CommandParams, ICommand } from "./Comands";

export class UpdateCommand<T extends string> implements ICommand<T>{

    name: string = "update";
    constructor(public room: QuixPhysicsRoom) {

    }
    onRoomMessage?(params: T): void {
        //this.room.phyController?.Send(this.name, params);
    }
    onPhyMessage?(params: T): void {
        let message: string[] = JSON.parse(params);


        for (let index = 0; index < message.length; index++) {
            const element = JSON.parse(message[index]);
            // console.log(element);
            if (element != null && this.room.State) {
                if (this.room.State.world.objects.has(element.uID)) {
                    let state = this.room.State.world.objects.get(element.uID);
                    if (state) {
                        state.position.x = element.position.X;
                        state.position.y = element.position.Y;
                        state.position.z = element.position.Z;

                        state.quaternion.x = element.quaternion.X;
                        state.quaternion.y = element.quaternion.Y;
                        state.quaternion.z = element.quaternion.Z;
                        state.quaternion.w = element.quaternion.W;
        
                    
                    }else{
                        console.log("No state in Schema")
                    }


                } else {
                    console.log("Tried to update an non exist object");
                }
            }

        }
    }


}