// not uno backend

// Dependencies
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        // Frontend origin
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});


// Listeners
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    // console.log(socket);

    // Chat message
    socket.on("chat", (data) => {
        console.log(data);

        // Broadcast
        socket.broadcast.emit("chat_receive", data);
    })
})


// Listen
const port = 3001;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})
