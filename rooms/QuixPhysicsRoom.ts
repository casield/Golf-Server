import { Client, Room } from "colyseus";
import { c } from "../c";
import { MapModel } from "../db/DataBaseSchemas";
import { WIBox } from "../db/WorldInterfaces";
import { BoxObject, GameState, GauntletMessage, ShotMessage, SphereObject, SwipeMessage, UserState } from "../schema/GameRoomState";
import { CommandReader, ContextTypes } from "./Physics/Comands/CommandReader";
import MessagesVars from "./Physics/MessagesVars";
import OVar from "./Physics/OVars/OVar";
import { OVarsManager } from "./Physics/OVars/OVarsManager";
import PhysicsController from "./Physics/PhysicsController";

export class QuixPhysicsRoom extends Room {
    State?: GameState;
    maxClients = 100;
    phyController?: PhysicsController;
    MapName = "arena"
    cR?: CommandReader;
    onCreate(options: any) {
        this.clock.start();
        this.setState(new GameState());
        this.State = this.state;
        this.phyController = new PhysicsController(this);

        this.cR = new CommandReader(this);

        this.onMessage("*",(client,type,message)=>{
            if(this.cR){
                 this.cR.execute(type as string,{roomId:this.roomId,clientId:client.sessionId,...message},ContextTypes.room)
            }
           
        })
    }
    onDispose() {
        this.phyController?.Send(MessagesVars.Close, {error:"null"});
        console.log("Closing QuixPhysics connection");
    }
    OnConnectedToServer() {
        if (this.clients.length == 0)
           this.generateMap(this.MapName);
    }
    timeout(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async OnDisconnectedFromServer() {
        console.log("Disconnected from physerver")
        this.clients.forEach(client => {
            console.log("Disconected a user")
            //client.leave(1,"Server has been closed");
        });

    }
    onJoin(client: Client, options: any) {
        let us = new UserState();
        us.sessionId = client.sessionId;
        // this.clients.push(client);
        this.State?.users.set(client.sessionId, us);
        let gem = new OVar("gems"+client.sessionId,0,this.phyController?.oVarsManager as OVarsManager)
        gem.addChangeListener(()=>{
           
            us.gems = gem.value;
        })
        this.createPlayer(us);

    }
    generateMap(mapName: string) {
        this.phyController?.Send("generateMap", {name:mapName});
    }
    createPlayer(user: UserState) {
        var box = new SphereObject();
        box.radius = 10;
        box.instantiate = true;
        box.type = "Player2"
        box.mesh = "Players/Sol/sol_prefab";
        box.quaternion = c.initializedQuat();
        box.mass = 30;
        box.position = c.createV3(2258, 1137, -545);
        box.owner = user.sessionId;

        // this.State.world.objects.set(box.uID,box);

        this.phyController?.Send(MessagesVars.create, box);
    }
}

