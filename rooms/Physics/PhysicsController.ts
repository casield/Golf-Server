import { QuixRoom } from "../QuixRoom";
import * as net from "net";
import { QuixPhysicsRoom } from "../QuixPhysicsRoom";
import { WIBox } from "../../db/WorldInterfaces";
import { BoxObject, ObjectMessage, ObjectState, SphereObject } from "../../schema/GameRoomState";
import { c } from "../../c";
import MessageBuffer from "./MessageBuffer";
import { connect } from "mongoose";
import { CommandParams } from "./Comands/Comands";
import { OVarsManager } from "./OVars/OVarsManager";
import { ContextTypes } from "./Comands/CommandReader";

export default class PhysicsController {
    received = new MessageBuffer("<L@>");
    client?: net.Socket;
    oVarsManager?:OVarsManager;
    constructor(public room: QuixPhysicsRoom) {
        this.connectToPhysics();
        this.oVarsManager = new OVarsManager(this);
    }

    connectToPhysics() {


        this.client = net.connect(1337, 'localhost', () => {
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
    
    }
    Send(type: string, data: any) {
        let ms: any = {};
        ms.type = type;
        ms.data = {...data,roomId:this.room.roomId};
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
                this.room.cR?.execute(json.type,json.data,ContextTypes.phy);
               
            }
        }




    }

}

