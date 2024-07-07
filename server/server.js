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
        origin: process.env.NODE_ENV === 'production' ?
            "https://uno.notkal.com" :  // Production website
            'http://localhost:3000',    // Development
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
function hideAll(arr, obfuscate) {
    for(let i in arr) {
        if(obfuscate) arr[i] = { hidden:true }; // Strip all other card data
        else arr[i].hidden = true; // Set hidden property but leave card data intact
    }
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
        
            draw_until_match: false,

            chat: true,
            xray: false
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

        this.players = [];

        // Dev tools
        this.control_everyone = true; // Currently does nothing

        // Register game
        allgames[roomID] = this;

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

    leave(socket, sendtoast) {
        const roomID = this.roomID;

        // Remove player from game
        delete this.players[this.getPnumFromSocketID(this.players, socket.id)];

        // Re-register user as being in room
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

        // All players have left
        if(this.players.length === 0) {
            console.log(`Room [${roomID}] is empty, closing game...`);
            delete allgames[roomID]; // Delete self
        }

        // Transfer ownership to remaining player
        else if(socket.id === this.host) this.host = this.playersBySocket[0];

        this.updateClients();
    }

    /** Send game state to clients */
    updateClients() {
        let clone = structuredClone(this);

        // Flatten data
        clone.usersParsed = this.users; // User list
        hideAll(clone.deck, true); // Obfuscate deck

        // Tailor data for each user
        // Cards that aren't visible to users are stripped of their
        // data before being sent to prevent cheating via devtools
        const sockets = this.playersBySocket;
        for(const socketID of sockets) {
            let tailoredGame = structuredClone(clone);

            // User ID
            tailoredGame.my_num = this.getPnumFromSocketID(tailoredGame.players, socketID);

            // Other player's cards
            if(!this.config.xray) {
                for(const pnum in tailoredGame.players) {
                    console.log(pnum, tailoredGame.my_num);
                    if(pnum != tailoredGame.my_num) hideAll(tailoredGame.players[pnum].cards, true);
                }
            }

            // Emit
            io.to(socketID).emit("gameState", tailoredGame);
        }
        
        // Emit raw data
        // this.emit("gameState", clone);
    }

    getPnumFromSocketID(players, socketID) {
        return players.findIndex(p => p?.socketID === socketID);
    }

    /** Emits to game's room */
    emit(eventName="gameState", data=false) {
        io.in(this.roomID).emit(eventName, data);
    }

    /** Starts the game (host only) */
    start(socket) {
        // Host
        if(socket.id !== this.host) {
            socket.emit("toast", { msg: "Only the host can start the game" });
            return;
        };

        // Minimum players
        // if(this.players.length < 2) {
        //     socket.emit("toast", { msg: "Not enough players" });
        //     return;
        // }

        // Setup
        this.deck = structuredClone(data.decks[this.config.deck]), // Deck you draw from
        this.pile = []; // Played cards pile

        this.turn = 0;
        this.turn_rotation_value = 0;
        this.direction = 1; // 1 is clockwise
        this.draw_count = 0; // This turns number of drawn cards

        hideAll(this.deck, false);
        shuffle(this.deck); // Shuffle

        this.moveCard("deck", "pile", false); // First card
        this.generatePlayers();

        // if(this.players.length < 2) return console.warn("Not enough players");
        this.state = "ingame";

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
        repeat(() => this.moveCard("deck", pnum, false, undefined, false), this.config.starting_cards);

        this.updateClients();
    }

    /** Moves a card from one location to another
     * @param {String|Number} fromName 
     * @param {String|Number} toName 
     * @param {Boolean} hidden 
     * @param {Number} fromIndex 
     * @returns 
     */
    moveCard(fromName, toName, hidden, fromIndex, runUpdateClients=true) {
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
            hideAll(this.deck, false);
            shuffle(this.deck);
        }

        if(runUpdateClients) this.updateClients();
    }


    drawCard(socketID) {
        const pnum = this.getPnumFromSocketID(this.players, socketID);

        if(this.turn !== pnum) return console.warn(`[Player ${pnum}] Not your turn (Currently player ${game.turn}'s turn)`);

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

    playCard(socketID, cardID) {

        const pnum = this.getPnumFromSocketID(this.players, socketID);

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


// Listeners
io.on("connection", (socket) => {
    // Set random username/avatar
    setUser(undefined, true);
    
    // Log
    console.log(`Connection: ${allusers[socket.id].name} [${socket.id}]`);

    // Join
    socket.on("join", data => {
        const roomID = data ?? getRoomUUID();
        joinRoom(roomID);
    })

    socket.on("leave", () => {
        getGameByUser()?.leave(socket, true);
        socket.emit("gameState", false);
    });
    
    // Set user profile
    socket.on("setUser", data => setUser(data));
    function setUser(newUser, bypassRatelimit=false) {
        if(typeof newUser === 'object') {
            if(newUser?.name === '' || typeof newUser?.name !== 'string') return;
            if(newUser?.name.length > 32) return socket.emit("toast", {
                title: "Invalid username",
                msg: `Maximum username length is 32 characters.`
            })
        }

        const existing = allusers?.[socket.id];

        // Ratelimit
        const ratelimit = (existing?.changes??0) > 100 ?
            30000 : // 30 seconds (if user has updated themselves 100+ times)
            500; // 0.5 seconds
        if(
            !bypassRatelimit &&
            existing?.changes >= 5 &&
            Date.now() <= (existing?.last_changed??0) + ratelimit
        ) return socket.emit("toast", {
            title: "Wait before trying again"
        })

        allusers[socket.id] = {
            name: newUser?.name ?? existing?.name ?? "Player",
            avatar: newUser?.avatar ?? existing?.avatar ?? arrRandom(data.avatars),
            socketID: socket.id,
            changes: (existing?.changes??0) + 1,
            last_changed: bypassRatelimit ? 0 : Date.now() // Timestamp
        }
        if(!bypassRatelimit) socket.emit("assignedUserData", allusers[socket.id]);
        // if(!bypassRatelimit) socket.emit("toast", {
        //     title: "Profile updated"
        // })
        getGameByUser()?.updateClients();
    }

    // Join room handler
    function joinRoom(roomID) {
        // ID is not a string or too long
        if(typeof roomID !== 'string' || roomID.length < 4 || roomID.length > 32) {
            console.warn(`Failed trying to join room: User ID ${socket.id}`);
            socket.emit("toast", {
                title: "Error",
                msg: `Failed trying to join room. Must be between 4 and 32 characters.`
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
            toastTitle = "Created lobby";
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
        for(const r of socket.rooms) allgames[r]?.leave(socket, false);
        
        // Rejoin personal room
        socket.join(socket.id);

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

    // Start game
    socket.on("start_game", data => {
        const game = getGameByUser();
        if(game === undefined) {
            console.warn(`Warning: Game is undefined. User: [${socket.id}]`);
            socket.emit("toast", {
                title: "Error",
                msg: "Game does not exist. Try making another one."
            })
            socket.emit("gameState", false);
            return;
        }
        game.start(socket);
    })

    socket.on("update_config", ({ option, value }) => {
        const game = getGameByUser();
        if(game === undefined || typeof option !== 'string') return;

        if(game.config.hasOwnProperty(option)) {
            if(typeof value !== typeof game.config[option]) return;

            game.config[option] = value;
            game.updateClients();
        }
    })

    socket.on("drawCard", () => {
        const game = getGameByUser();
        game.drawCard(socket.id);
    })

    socket.on("playCard", cardID => {
        const game = getGameByUser();
        game.playCard(socket.id, cardID);
    })

    // Chat message
    socket.on("chat", (data) => {
        if(typeof data.msg !== 'string' || data.msg.length < 1) return;

        const roomID = usersRooms[socket.id];
        data.user = allusers[socket.id];
        data.socketID = socket.id;

        // Log
        console.log(`[${roomID}] ${data.user.name}: ${data.msg}`);

        // Broadcast
        io.to(roomID).emit("chat_receive", data);
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log(`Disconnected: ${socket.id}`);
        console.log(socket.id);

        getGameByUser()?.leave(socket);

        // De-register
        delete allusers[socket.id];
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
        return allgames[usersRooms[socket.id]];
    }
})


// Listen
const port = 3001;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})
