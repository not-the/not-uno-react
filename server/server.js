// not uno backend

// Dependencies
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const data = require('./data.json');

// CORS
const cors = require("cors");
app.use(cors());

/** Express server instance */
const server = http.createServer(app);

/** Socket.io */
const io = new Server(server, {
    cors: {
        // Frontend origin
        // origin: "http://localhost:3000",
        origin: "*",
        // methods: ["GET", "POST"]
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

/** Uses the modulus operator to keep a value within amount */
function clamp(value, max) {
    return ((value % max) + max) % max;
}

/** Shuffles are array by modifying it, then returns original array (now shuffled)
 * https://stackoverflow.com/a/2450976/11039898
*/
function shuffle(array) {
    let currentIndex = array.length;
 
    // While there remain elements to shuffle...
    while(currentIndex !== 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
 
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
 
    return array;
 }
 
 /** Repeat function
  * https://stackoverflow.com/a/35556907/11039898
  * @param {Function} func 
  * @param {Number} times 
  */
 function repeat(func, times=1) {
     func();
     times && --times && repeat(func, times);
 }


/** Tests whether a move is valid
 * @param {Object} card_a 
 * @param {Object} card_b 
 * @returns {Boolean}
 */
function testCards(card_a, card_b) {
    if(
        card_a.type === card_b.type // Type
        || card_a.color === card_b.color // Color
        || card_a.color === "black"
        || card_b.color === "black"
    ) return true;
    return false;
}

/** Sets the hidden property to true for all cards in an array */
function hideAll(arr) {
    for(let i in arr) arr[i].hidden = true;
    return arr;
}

// Key = socket.id, value = roomID
const usersRooms = {};
const allgames = {};
const allusers = {};



/** Game class */
class Uno {
    constructor({ roomID, host }) {
        // Config
        this.config = {
            deck: "normal",
            starting_cards: 7,
        
            // allow_continues: false, // Offer to continue game with remaining players after someone wins
            // require_calling_uno: false,
            // call_penalty: 'draw',
            // call_penalty_draw_amount: 2,
        
            draw_until_match: false
        }

        // Data
        this.roomID = roomID;
        this.host = host;

        // Player-specific
        this.my_num = 0;
            
        // State
        // this.started = false;
        this.state = 'lobby';
        this.winner = false;

        this.deck = structuredClone(data.decks[this.config.deck]), // Deck you draw from
        this.pile = []; // Played cards pile

        this.players = [];
        this.playerMap = {}; // key:value = socketID:playerNumber
        this.turn = 0;
        this.turn_rotation_value = 0;
        this.direction = 1; // 1 is clockwise
        this.draw_count = 0; // This turns number of drawn cards

        // Dev tools
        this.control_everyone = true; // Currently does nothing
        xray: false;
        // this.xray = true;

        // Register game
        allgames[roomID] = this;


        // Setup
        hideAll(this.deck);
        shuffle(this.deck); // Shuffle

        // this.addPlayer(); // Player
        // this.addPlayer(); // Player

        this.moveCard("deck", "pile", false); // First card

        // Update
        this.updateClients();
    }

    get playersBySocket() { return getRoomUsers(this.roomID); }

    /** Object of users (socketID:data pairs) */
    get users() {
        let users = {};
        for(const PID of this.playersBySocket) users[PID] = allusers[PID];
        return users;
    }

    /** Send game state to clients */
    updateClients() {
        let clone = structuredClone(this);
        clone.usersParsed = this.users; // User list
        this.emit("gameState", clone);
    }

    /** Emits to game's room */
    emit(eventName="gameState", data=false) {
        io.in(this.roomID).emit(eventName, data);
    }

    /** Starts the game (host only) */
    start(socket) {
        if(socket.id !== this.host) {
            socket.emit("toast", { msg: "Only the host can start the game" });
            return;
        };

        // if(this.players.length < 2) return console.warn("Not enough players");
        this.state = "ingame";
        this.generatePlayers();
        this.updateClients();
    }

    generatePlayers() {
        let sockets = this.playersBySocket;
        for(let i = 0; i < sockets.length; i++) {
            this.addPlayer(sockets[i]);
        }
    }

    addPlayer(socketID) {
        this.players.push({
            socketID,
            cards: []
        });

        // Give cards
        const pnum = this.players.length-1;
        repeat(() => this.moveCard("deck", pnum, false), this.config.starting_cards);

        this.updateClients();
    }

    /** Moves a card from one location to another
     * @param {String|Number} fromName 
     * @param {String|Number} toName 
     * @param {Boolean} hidden 
     * @param {Number} fromIndex 
     * @returns 
     */
    moveCard(fromName, toName, hidden, fromIndex) {
        // Get to/from locations
        let from = typeof fromName === 'number' ?
            this.players[fromName].cards : // Player
            this[fromName]; // Location
        let to = typeof toName === 'number' ?
            this.players[toName].cards : // Player
            this[toName]; // Location

        // Take card
        let card = fromIndex === undefined ? from.shift() : from.splice(fromIndex, 1)[0];

        if(card === undefined) return console.warn('Card is undefined'); // Error
        if(hidden !== undefined) card.hidden = hidden; // Unhide
        to.push(card); // Move

        // Empty deck
        if(fromName === 'deck' && this.deck.length === 0) {
            console.log('Shuffling pile back into deck');

            // Move cards
            this.deck = structuredClone(this.pile.slice(0, -1));
            this.pile = [ this.pile[this.pile.length-1] ];

            // Hide/shuffle
            hideAll(this.deck);
            shuffle(this.deck);
        }

        this.updateClients();
    }


    drawCard(pnum) {
        if(this.turn !== pnum) return console.warn(`[Player ${pnum}] Not your turn`);

        // 1 draw limit
        // if(!this.config.draw_until_match && game.draw_count > 0) {

        //     // Test if last drawn card is valid. If not, end turn
        //     const deckTop = game.deck[game.deck.length-1];
        //     const player = game.players[pnum];
        //     const playerLast = player[player.length-1]
        //     if(!testCards(deckTop, playerLast)) this.nextTurn(this);

        //     // Update state
        //     setGame(this);

        //     return;
        // }

        // Move card
        this.moveCard("deck", pnum, false);
        this.draw_count++;
    }

    playCard(pnum, cardID) {
        console.log(pnum);
        if(this.turn !== pnum) {
            console.warn(`[Player ${pnum}] Not your turn`);
            return false;
        };

        // Cards
        const playerCard = this.players[pnum].cards[cardID];
        if(playerCard === undefined) {
            console.warn(`[Player ${pnum}] Card #${cardID} doesn't exist`);
            return false;
        };
        const pileTop = this.pile[this.pile.length-1];

        // Test
        if(!testCards(playerCard, pileTop)) {
            console.warn(`[Player ${pnum}] Invalid card`);
            return false;
        }


        const endMove = () => {
            // Play card
            this.moveCard(pnum, "pile", false, cardID);

            // Prep for next turn
            if(playerCard.reverse) this.direction *= -1;
            this.nextTurn(playerCard.skip, this);

            // Next player
            const nextPlayerID = this.turn;
            if(playerCard.draw) repeat(() => this.moveCard("deck", nextPlayerID, false), playerCard.draw);

            // Update state
            // setGame(modifiedGame);
            this.updateClients();
        }


        // Choose color
        // if(playerCard.choose_color) {
        //     setDialog('choose_color');
        //     setDialogAction(function(value) {
        //         playerCard.color = value;
        //         endMove();
        //     });
        // }

        // else
        endMove();
    }


    nextTurn(skip=0) {
        const turnValue = ((1 + skip) * this.direction);
        this.turn = clamp(
            this.turn + turnValue,
            this.players.length
        );
        this.turn_rotation_value += turnValue;
        this.draw_count = 0;
    }
}

function arrRandom(arr) {
    return arr[Math.floor(Math.random()*arr.length)]
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function randomName() {
    const adjective = capitalizeFirstLetter(arrRandom(data.names.adjectives));
    const noun = arrRandom(data.names.nouns);
    return `${adjective} ${noun}`
}


// Listeners
io.on("connection", (socket) => {
    // Set random username/avatar
    setUser();
    
    // Log
    console.log(`Connection: ${allusers[socket.id].name} [${socket.id}]`);

    // Join
    socket.on("join", data => {
        const roomID = data ?? getRoomUUID();
        joinRoom(roomID);
    })
    
    // Set user profile
    socket.on("setUser", data => setUser(data));
    function setUser(data) {
        const existing = allusers?.[socket.id];
        allusers[socket.id] = {
            name: data?.name ?? existing?.name ?? randomName(),
            avatar: data?.avatar ?? existing?.avatar ?? false
        }
        socket.emit("assignedUserData", allusers[socket.id]);
        getGameByUser()?.updateClients();
    }

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
        let toastTitle = "Joined game";
        if(game === undefined) {
            game = new Uno({
                roomID,
                host: socket.id
            });
            toastTitle = "Created game";
        }
        // Game exists and is already started
        else if(game.state !== "lobby") {
            socket.emit("toast", {
                title: "Can't join",
                msg: `Game has already started (room ID: ${roomID})`
            });
            return;
        }

        // Leave all other rooms
        for(const r of socket.rooms) leaveRoom(r, false);

        // Join
        usersRooms[socket.id] = roomID;
        socket.join(roomID);
        socket.emit("joined", roomID); // Give client room ID
        // console.log(socket.id, ' is in rooms: ', socket.rooms);

        // Toast
        socket.emit("toast", {
            title: toastTitle,
            msg: `Room ID: "${roomID}"`
        });

        socket.to(roomID).emit("toast", {
            msg: `User "${allusers[socket.id].name}" joined!\n[${socket.id}]`
        });

        game.updateClients();
    }

    function leaveRoom(roomID, sendtoast=true) {
        console.log(roomID,  ' participants: ', getRoomUsers(roomID))

        let game = allgames[roomID];
        if(game !== undefined) {
            // All players have left
            if(game.playersBySocket.length === 0) {
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

    // Start game
    socket.on("start_game", data => {
        const game = getGameByUser();
        game.start(socket);
    })

    socket.on("drawCard", PID => {
        const game = getGameByUser();
        game.drawCard(PID);
    })

    socket.on("playCard", ({ PID, cardID }) => {
        const game = getGameByUser();
        game.playCard(PID, cardID);
    })
    

    // Chat message
    socket.on("chat", (data) => {
        if(typeof data.msg !== 'string' || data.msg.length < 1) return;

        const roomID = [...socket.rooms][0];
        
        data.user = allusers[socket.id];
        console.log(`[${roomID}] ${data.user.name}: ${data.msg}`);

        // Broadcast
        socket.to(roomID).emit("chat_receive", data);
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log(`Disconnected: ${socket.id}`);
        console.log(socket.id);
        leaveRoom(usersRooms[socket.id]);

        // De-register
        // delete allusers[socket.id];
    });


    // Debug
    socket.on("debug", (data) => {
        socket.emit("debug", {
            usersRooms,
            allgames,
            allusers
        })
    });


    // FUNCTIONS
    function getGameByUser() {
        return allgames[[...socket.rooms][0]];
    }
})


// Listen
const port = 3001;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})
