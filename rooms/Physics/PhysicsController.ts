import { QuixRoom } from "../QuixRoom";
import * as net from "net";
import { QuixPhysicsRoom } from "../QuixPhysicsRoom";
import { WIBox } from "../../db/WorldInterfaces";
import { BoxObject, ObjectMessage, ObjectState, SphereObject } from "../../schema/GameRoomState";
import { c } from "../../c";
import MessageBuffer from "./MessageBuffer";
import { connect } from "mongoose";
import { CommandParams } from "./Comands/Comands";

export default class PhysicsController {
    received = new MessageBuffer("<L@>");
    client?: net.Socket;
    constructor(public room: QuixPhysicsRoom) {
        this.connectToPhysics();
    }

    connectToPhysics() {


        this.client = net.connect(1337, '127.0.0.1', () => {

            // console.log(this);
            // this.Send("hello", "Hola wn");

        });

        this.client.on("connect", this.connect.bind(this));
        this.client.on('data', (e) => {
            this.readData(e)
        });
        this.client.on("error", (err) => {
            console.log(err);
            //this.room.OnDisconnectedFromServer();
        })


    }
    private connect() {
        console.log("Connected to QuixPhysics");
        this.room.OnConnectedToServer();
    }
    Send(type: string, data: any) {
        let ms: any = {};
        ms.type = type;
        ms.data = data;
        let string = JSON.stringify(ms);
        //console.log("sending", string);
        this.client?.write(string + this.received.delimiter)
    }
    readData(data: Buffer) {

        this.received.push("" + data)

        while (!this.received.isFinished()) {
            const message = this.received.handleData()
            //console.log("reading: ",message.length);
            if (message != null) {
                let json = JSON.parse(message.toString());
                if (json.type == "create") {

                    let message = JSON.parse(json.data);
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
                if (json.type == "update") {
                    let message: string[] = JSON.parse(json.data);
                    //console.log("Message lenght",message.length);

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
                                }


                            } else {
                                console.log("Tried to update an non exist object");
                            }
                        }



                        // console.log(this.room.State.world.objects.get(element.uID));

                    }

                }
                if (json.type == "objectMessage") {
                    var dataObj = JSON.parse(json.data);
                    var om = new ObjectMessage();
                    om.uID = dataObj.uID;
                    om.message = dataObj.data;
                    this.room.broadcast("objectMessage", om);
                }
            }
        }




    }

}

