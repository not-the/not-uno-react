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
        // Not a string or too long
        if(typeof roomID !== 'string' || roomID.length > 32) {
            console.warn(`Failed trying to join room: User ID ${socket.id}`);
            socket.emit("toast", {
                title: "Error",
                msg: `Failed trying to join room: User ID ${socket.id}`
            });
            return;
        };

        // Leave previous
        for(const r of socket.rooms) socket.leave(r);

        // Join
        socket.join(roomID);
        socket.emit("joined", roomID);
        console.log(socket.id, ' is in rooms: ', socket.rooms);

        socket.emit("toast", {
            title: "Joined game",
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
})


// Listen
const port = 3001;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})
