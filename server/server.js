// not uno backend

// Dependencies
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");

// CORS
const cors = require("cors");
app.use(cors());

/** Express server instance */
const server = http.createServer(app);

/** Socket.io */
const io = new Server(server, {
    cors: {
        // Frontend origin
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

/** Creates a URL-safe base64 encoded UUID */
function getRoomUUID(uuid=crypto.randomUUID()) {
    // Convert
    let result = Buffer.from(uuid.replace(/-/g, ''), 'hex').toString('base64url');

    // Reduce in length (This increases the odds of duplicate UUIDs being produced, but since we're not dealing with sensitive data it's unique enough)
    result = result.substring(0, 9);

    return result;
}

/** Returns an array of socket IDs that are in a given room
 * @param {String} roomID 
 * @returns {Array}
 */
function getRoomUsers(roomID) {
    return [...io.sockets.adapter.rooms.get(roomID)??[]];
}

// Key = socket.id, value = roomID
const usersRooms = {};
const allgames = {};

class Uno {
    constructor(roomID) {

        this.roomID = roomID;

        allgames[roomID] = this;
    }

    get players() {
        return getRoomUsers(this.roomID);
    }

    // constructor() {
    //     // Player-specific
    //     this.player_num = 0;
    //     // host: true,
        
    //     // State
    //     // started: false,
    //     // state: 'play',
    //     // winner: false,
    
    //     this.deck = structuredClone(data.decks[config.deck]), // Deck you draw from
    //     pile: [], // Played cards pile
    
    //     players: [],
    //     turn: 0,
    //     turn_rotation_value: 0,
    //     direction: 1, // 1 is clockwise
    //     draw_count: 0, // This turns number of drawn cards
    
    //     // Dev tools
    //     control_everyone: true, // Currently does nothing
    //     // xray: false,
    //     xray: true,
    // }
}




// Listeners
io.on("connection", (socket) => {
    // Log
    console.log(`User connected: ${socket.id}`);

    // Join
    socket.on("join", data => {
        const roomID = data ?? getRoomUUID();
        joinRoom(roomID);
    })
    
    // Join room handler
    function joinRoom(roomID) {
        // ID is not a string or too long
        if(typeof roomID !== 'string' || roomID.length > 32) {
            console.warn(`Failed trying to join room: User ID ${socket.id}`);
            socket.emit("toast", {
                title: "Error",
                msg: `Failed trying to join room. Maximum length is 32 characters.`
            });
            return;
        };

        // Create/join game
        let game = allgames[roomID];
        if(game === undefined) {
            game = new Uno(roomID);
        }
        // Game already exists
        // else {
        //     
        // }

        // Leave all other rooms
        for(const r of socket.rooms) leaveRoom(r, false);

        // Join
        usersRooms[socket.id] = roomID;
        socket.join(roomID);
        socket.emit("joined", roomID); // Give client room ID
        // console.log(socket.id, ' is in rooms: ', socket.rooms);

        // Toast
        socket.emit("toast", {
            title: "Joined game",
            msg: `Room ID: "${roomID}"`
        });

        socket.to(roomID).emit("toast", {
            msg: `User [${socket.id}] joined!`
        });
    }

    function leaveRoom(roomID, sendtoast=true) {
        console.log(roomID,  ' participants: ', getRoomUsers(roomID))

        let game = allgames[roomID];
        if(game !== undefined) {
            // All players have left
            if(game.players.length === 0) {
                console.log(`Room [${roomID}] is empty, closing game...`);
                delete allgames[roomID];
            }
        }

        delete usersRooms[socket.id];
        socket.leave(roomID);

        // Tell room someone left
        socket.to(roomID).emit("toast", {
            msg: `User [${socket.id}] left!`
        })

        // Tell user they left
        if(sendtoast) socket.emit("toast", {
            title: "Left game",
            msg: `Room ID: "${roomID}"`
        });
    }
    

    // Chat message
    socket.on("chat", (data) => {
        const roomID = [...socket.rooms][0];
        console.log("ROOM: ", roomID);

        // Broadcast
        socket.to(roomID).emit("chat_receive", data);
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log(`Disconnected: ${socket.id}`)
        leaveRoom(usersRooms[socket.id]);
    });


    // Debug
    socket.on("debug", (data) => {
        socket.emit("debug", {
            usersRooms,
            allgames
        })
    });
})


// Listen
const port = 3001;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})
