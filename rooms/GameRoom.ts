import { Room, Client, Delayed } from "colyseus";
import { MapSchema, ArraySchema } from '@colyseus/schema'
import { GameState, UserState, PowerState, Message, TurnPlayerState, V3, ObjectState, BoxObject, WorldState } from "../schema/GameRoomState";
import { MWorld } from "../world/world";
import { SUser } from "../schema/SUser";
import _, { isNil, toInteger } from 'lodash';
import CANNON, { Vec3, Quaternion } from 'cannon';
import { MapsRoom } from "./MapsRoom";
import { Collection } from "mongoose";
import { BoxModel, SphereModel } from "../db/DataBaseSchemas";
import { AddOneShot_Power } from "./powers/AddOneShot_Power";
import { CreateBox_Power } from "./powers/CreateBox_Power";
import { FlashEnemies_Power } from "./powers/FlashEnemies_Power";
import { Power } from "./powers/Power";
import { c } from "../c";

export class GameRoom extends Room {
  delayedInterval: Delayed;
  public world: MWorld;
  public users = new Map<string, SUser>();
  public State: GameState;;
  public gameControl: GameControl;


  onCreate(options: any) {

    this.clock.start();

    this.setState(new GameState());
    this.State = this.state;

    this.world = new MWorld(this, this.state);

    this.readMessages();

    this.delayedInterval = this.clock.setInterval(() => {
      this.tick();
    }, 10);

    this.clock.setInterval(()=>{
      this.world.updateState();
    },45);


  }

  changeMap(name: string) {
    console.log("Changin map to -"+name)
    this.world.sobjects.forEach(ob => {
      if(ob.objectState.type != "golfball"){
        this.world.deleteObject(ob);
      }
      
    })

    this.world.sObstacles.forEach(ob => {
      ob.destroy();
    })
    this.world.generateMap(name, null);
    this.State.winner = null;

    this.broadcast("changeMap");


  }

  readMessages() {
    this.onMessage("setName", (client, message) => {
      this.state.name = message;
    });
    this.onMessage("shoot", (client, message) => {
      this.users.get(client.sessionId).golfball.setRotationQ(message.rotx, message.roty, message.rotz, message.rotw);
      var potency = message.force * 50;
      var potency2 = message.force * 30;

      var jumpForce = 2.2;


      this.State.turnState.players[client.sessionId].shots -= 1;
      this.State.turnState.players[client.sessionId].ballisMoving = true;
      this.users.get(client.sessionId).golfball.body.applyLocalImpulse(new CANNON.Vec3(
        0,
        (-message.contacty * potency) * jumpForce,
        (potency)
      ),

        new CANNON.Vec3(-message.contactx * potency2, 0, 0));



    })

    this.onMessage("stop", (client, message) => {
      this.stopBall(this.users.get(client.sessionId).userState);
      //this.changeMap("mapa2");
    })



    this.onMessage("buy-power", (client, message: PowerState) => {
      this.buyPower(client, message);
    })
    this.onMessage("activate-power", (client, message: PowerState) => {
      this.activatePower(client, message);
    })


    this.onMessage("chat", (client, message) => {
      var mes = new Message();
      mes.user = this.State.users[client.id];
      mes.message = message;
      this.State.chat.messages.push(mes);
    });

  }




  activatePower(client: Client, message: PowerState) {
    var power: Power = this.users.get(client.sessionId).bag.get(message.uID);

    //  var power:Power = new (powers[message.type].constructor as any)(this);
    power.setOwner(this.users.get(client.sessionId))
    //power.uniqueID = c.uniqueId();
    power.powerState = Power.load(new PowerState(), message);
    // console.log(power,powers[message.type]);
    power.activate();
  }

  buyPower(client: Client, message: PowerState) {
    var tps: TurnPlayerState = this.State.turnState.players[client.sessionId];
    var powerState: PowerState = Power.load(new PowerState(), message);

    if (tps.gems - message.cost >= 0) {
      tps.gems -= message.cost;

      var enofspace = false;

      for (var a = 0; a < 3; a++) {
        if (tps.bag.slots[a] == null || tps.bag.slots[a].uID == "empty") {

          var shopPower = this.users.get(client.sessionId).shop.get(powerState.uID);
          powerState.uID = c.uniqueId();
          
          tps.bag.slots[a] = powerState;

          let cloned = shopPower.clone();
          cloned.uniqueID = powerState.uID;
          this.users.get(client.sessionId).bag.set(powerState.uID, cloned);
          this.users.get(client.sessionId).bag.get(powerState.uID).slot = a;
          this.users.get(client.sessionId).bag.get(powerState.uID).uniqueID = powerState.uID;
          this.users.get(client.sessionId).bag.get(powerState.uID).powerState.uID = powerState.uID;
          enofspace = true;
          break;
        }
      }

      if (!enofspace) {
        client.send("error", "Not enough space in your bag.")
      }
    } else {
      client.send("error", "Not enough gems to buy this item.")
    }
  }

  stopBall(user: UserState) {
    this.users.get(user.sessionId).golfball.body.velocity = new Vec3(0, 0, 0);
    this.users.get(user.sessionId).golfball.body.angularVelocity = new Vec3(0, 0, 0);
    //this.users.get(this.State.turnState.turnOwner.sessionId).golfball.body.angularDamping = 0;
    this.users.get(user.sessionId).golfball.body.quaternion = new Quaternion(0, 0, 0, 1);
  }

  public setWinner(winnerBall: ObjectState) {

    this.State.winner = winnerBall.owner;
  }
  onJoin(client: Client, options: any) {

    if (this.users.size == 0) {
      this.world.generateMap("mapa", null)
      this.gameControl = new GameControl(this);

    }
    this.createUser(client);

    //Change to something with user input.
    if (this.users.size == 1) {
      this.gameControl.startGame();
    }
    this.getTurnPlayer(client.sessionId).bag.shop = this.gameControl.generateShop(this.users.get(client.sessionId));

  }

  createUser(client: Client) {
    var us = new UserState();
    us.sessionId = client.sessionId;

    var su = new SUser(client, this, us);

    this.users.set(client.sessionId, su);

    this.State.users[client.sessionId] = us;

    this.State.turnState.players[client.sessionId] = new TurnPlayerState();
    this.State.turnState.players[client.sessionId].user = us;

    this.State.turnState.players[client.sessionId].bag.owner = us;

    console.log("Welcome to " + client.sessionId);

    return su;
  }

  getTurnPlayer(sessionID: string): TurnPlayerState {
    return this.State.turnState.players[sessionID];
  }

  stopVelocity = 30.8;
  stopAngularVelocity = 1.8;

  ballsStatic(user: UserState) {

    var bodyVel = this.users.get(user.sessionId).golfball.body.velocity;
    var angularVelocity = this.users.get(user.sessionId).golfball.body.angularVelocity;
    if (
      bodyVel.z <= this.stopVelocity && bodyVel.z >= -this.stopVelocity &&
      bodyVel.x <= this.stopVelocity && bodyVel.x >= -this.stopVelocity &&
      bodyVel.y <= this.stopVelocity - 5 && bodyVel.y >= -(this.stopVelocity - 5) &&
      angularVelocity.x <= this.stopAngularVelocity && angularVelocity.x >= -this.stopAngularVelocity &&
      angularVelocity.y <= this.stopAngularVelocity && angularVelocity.y >= -this.stopAngularVelocity &&
      angularVelocity.z <= this.stopAngularVelocity && angularVelocity.z >= -this.stopAngularVelocity
    ) {
      return true;
    }
    return false;
  }

  tick() {

    if (this.world.ballSpawn) {
      this.world.tick(Date.now());
      this.gameControl.tick();
    }

  }



  onLeave(client: Client, consented: boolean) {
    console.log("Loging out "+client.sessionId);
    var user = this.users.get(client.sessionId);
    
    
    this.world.deleteObject(this.users.get(client.sessionId).golfball);
    delete this.State.turnState.players[client.sessionId];
    this.users.delete(client.sessionId);
    //delete this.State.world.objects[client.sessionId];
  }

  onDispose() {
  }

}

class GameControl {
  gameRoom: GameRoom;
  newTurn: boolean = true;
  constructor(gameRoom: GameRoom) {
    this.gameRoom = gameRoom;
  }

  public startGame() {
   // this.nextTurn(false);
  }

  tick() {

    this.checkIfBallsFalling();
    var shotsCount = 0;
    var stoppedCount = 0;

    this.gameRoom.users.forEach(user => {
      var playerS = this.gameRoom.State.turnState.players[user.userState.sessionId];

      //Stop the ball before ballIsMoving becomes true.
      if (playerS != null) {
        if (this.gameRoom.ballsStatic(user.userState) && this.gameRoom.State.turnState.players[user.userState.sessionId].ballisMoving) {
          this.gameRoom.stopBall(user.userState);
        }
        if (playerS.shots == 0) {
          shotsCount++;
        }
        if (this.gameRoom.ballsStatic(user.userState)) {
          stoppedCount++;
          this.gameRoom.State.turnState.players[user.userState.sessionId].ballisMoving = false;
        }

        if (this.newTurn) {
          this.gameRoom.stopBall(user.userState);
          this.newTurn = false;
        }
      }


    });
    if (shotsCount == this.gameRoom.users.size && stoppedCount == this.gameRoom.users.size && !this.newTurn) {
      //Everyone shoot
      this.nextTurn(false);
      this.newTurn = true;
    }

    this.checkWinner();
  }

  checkWinner() {
    if (this.gameRoom.State.winner != null) {
      this.gameRoom.changeMap("mapa2");
    }
  }

  //Check if any ball is falling and it places it to the ball spawn position.
  checkIfBallsFalling() {
    this.gameRoom.users.forEach(element => {
      if (element.golfball.body.position.y < -50.5) {

        var checkpoint = this.gameRoom.State.turnState.players[element.client.sessionId].checkpoint;

        if (checkpoint.x == 0 && checkpoint.y == 0 && checkpoint.y == 0) {
          checkpoint.x = this.gameRoom.world.ballSpawn.x;
          checkpoint.y = this.gameRoom.world.ballSpawn.y;
          checkpoint.z = this.gameRoom.world.ballSpawn.z;
          this.gameRoom.State.turnState.players[element.client.sessionId].checkpoint = checkpoint;
        }
        this.gameRoom.stopBall(element.userState);
        element.golfball.setPosition(checkpoint.x, checkpoint.y, checkpoint.z);
      }
    });
  }
  generateShop(owner: SUser): ArraySchema<PowerState> {
    var shopSize = 3;
    var list: Array<Power> = [new AddOneShot_Power(this.gameRoom), new CreateBox_Power(this.gameRoom), new FlashEnemies_Power(this.gameRoom)]
    //owner.shop = new Map<string, Power>();
    var map: ArraySchema<PowerState> = new ArraySchema<PowerState>();
    for (var a: number = 0; a < shopSize; a++) {
      var random = toInteger(c.getRandomNumber(0, list.length));
      var pO: Power = list[random];
      pO.uniqueID = c.uniqueId();
      pO.powerState.uID = pO.uniqueID;
      map[a] = pO.giveState();
      owner.shop.set(pO.uniqueID, pO);
    }

    return map;
  }
  addTurnGems(player: TurnPlayerState): number {
    var gems = this.gameRoom.State.turnState.players[player.user.sessionId].gems;
    gems += this.gameRoom.State.turnState.gemsPerTurn;

    return gems;
  }
  nextTurn(deleteCheckPoint: boolean) {
    this.gameRoom.users.forEach(user => {
      var olderPlayer: TurnPlayerState = this.gameRoom.State.turnState.players[user.userState.sessionId];
      var checkpoint = olderPlayer.checkpoint;
      var gems = this.addTurnGems(olderPlayer)
      var slots = olderPlayer.bag.slots;



      var turnplayer = this.gameRoom.State.turnState.players[user.userState.sessionId] = new TurnPlayerState();
      turnplayer.user = user.userState;
      turnplayer.gems = gems;
      turnplayer.checkpoint = checkpoint;
      turnplayer.bag.shop = this.generateShop(user);
      turnplayer.bag.slots = slots;
      // console.log(turnplayer.bag.shop.);
    });

    this.gameRoom.State.turnState.turn += 1;
  }

}