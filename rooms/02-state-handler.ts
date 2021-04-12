import { Room, Client } from "colyseus";
import { Schema, type, MapSchema, SetSchema } from "@colyseus/schema";

type SkillName = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

export class Player extends Schema {
    @type({ set: "string" })
    skills = new SetSchema<SkillName>();

    @type("number")
    x = Math.floor(Math.random() * 400);

    @type("number")
    y = Math.floor(Math.random() * 400);
}

export class State extends Schema {
    @type({ map: Player })
    players = new MapSchema<Player>();

    something = "This attribute won't be sent to the client-side";
    moves = 0;

    createPlayer(sessionId: string) {
        const player = new Player();
        player.skills.add("A");
        player.skills.add("B");
        player.skills.add("C");
        this.players.set(sessionId, player);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    movePlayer (sessionId: string, movement: any) {
        this.moves++;
        if (movement.x) {
            this.players.get(sessionId).x += movement.x * 10;
        } else if (movement.y) {
            this.players.get(sessionId).y += movement.y * 10;
        }

        if (this.moves > 5) {
            this.players.get(sessionId).skills.delete("A");
            this.players.get(sessionId).skills.add("D");
            this.players.get(sessionId).skills.delete("B");
            this.players.get(sessionId).skills.add("E");
            this.players.get(sessionId).skills.delete("C");
            this.players.get(sessionId).skills.add("F");

            console.log(this.players.get(sessionId).skills.toArray());
        }
    }
}

export class StateHandlerRoom extends Room<State> {
    maxClients = 4;

    onCreate (options) {
        console.log("StateHandlerRoom created!", options);

        this.setState(new State());

        this.onMessage("move", (client, data) => {
            console.log("StateHandlerRoom received message from", client.sessionId, ":", data);
            this.state.movePlayer(client.sessionId, data);
        });
    }

    onAuth(client, options, req) {
        return true;
    }

    onJoin (client: Client) {
        client.send("hello", "world");
        this.state.createPlayer(client.sessionId);
    }

    onLeave (client) {
        this.state.removePlayer(client.sessionId);
    }

    onDispose () {
        console.log("Dispose StateHandlerRoom");
    }

}
