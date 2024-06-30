import { useState, useEffect } from 'react'
import Game from './components/Game.js'
import Lobby from './components/Lobby.js'

// Socket.io
import { socket } from './socket.js';


// Game
const data = require('./data.json');

const config = {
    deck: "normal",
    starting_cards: 7,

    // allow_continues: false, // Offer to continue game with remaining players after someone wins
    // require_calling_uno: false,
    // call_penalty: 'draw',
    // call_penalty_draw_amount: 2,
    
    draw_until_match: false
}

const newGame = () => {
    return {
        started: false,
        state: 'play',
        winner: false,
    
        deck: structuredClone(data.decks[config.deck]), // Deck you draw from
        pile: [], // Played cards pile
    
        players: [],
        turn: 0,
        turn_rotation_value: 0,
        direction: 1, // 1 is clockwise
        draw_count: 0, // This turns number of drawn cards
    
        // Dev tools
        control_everyone: true, // Currently does nothing
        // xray: false,
        xray: true,
    }
}

const defaultGame = newGame();



export default function App() {

    // Game
    let [game, setGame] = useState(structuredClone(defaultGame));

    // Menu {String}
    let [menu, setMenu] = useState("null");
    let page =
        menu === "game" ? <Game config={config} game={game} setGame={setGame} /> : // Game
        menu === "lobby" ? <Lobby config={config} game={game} setGame={setGame} /> : // Lobby
        null; // Home


    // Chat
    const [chatInput, setChatInput] = useState("");

    const sendChat = () => {
        socket.emit("chat", { msg:chatInput });
        // newChatMsg(chatInput);
        // setChatInput("");
    }

    const newChatMsg = (msg) => {
        setChatCache(old => [...old, msg]); // Push new message
    }

    const joinRoom = () => {
        // Join room from URL
        let urlRoom = window.location.hash.substring(1);
        if(urlRoom === '') urlRoom = undefined;
        socket.emit("join", urlRoom);
    }

    const [chatCache, setChatCache] = useState([]);
    useEffect(() => {
        // Auto join from URL
        if(window.location.hash !== '') joinRoom();

        // Receive MSG
        socket.on("chat_receive", (data) => {
            newChatMsg(data.msg);
        });

        // Joined to room
        socket.on("joined", roomID => {
            if(window.location.hash === '') window.location.hash = `#${roomID}`;

            setMenu("lobby");
        })

        // Unmount
        return () => {
            socket.off("chat_receive");
            socket.off("join");
            window.location.hash = '';
        }
    }, []);

    return (
        <>
            {/* Debug menu */}
            {/* <nav>
                <button onClick={() => setMenu("home")}>Home</button>
                <button onClick={() => setMenu("lobby")}>Lobby</button>
                <button onClick={() => setMenu("game")}>Game</button>
            </nav> */}

            {/* Chat test */}
            <h1>Socket test</h1>
            <input type="text" name="chat_input" id="chat_input" onChange={event => setChatInput(event.target.value)} onKeyDown={event => { if(event.key === "Enter") sendChat() }} />
            <button onClick={sendChat}>Send</button>

            <br/>
            <br/>
            <h3>Messages:</h3>
            <div>
                {chatCache.map((msg, index) => <p key={index}>{msg}</p>)}
            </div>
            <br/>
            <br/>

            <main>
                {
                    page ??
                    <>
                        <h1>Not UNO</h1>
                        {/* <button>Create</button>
                        <button>Join</button> */}
                        <button onClick={joinRoom}>CREATE LOBBY</button>
                    </>
                }
            </main>
        </>
    );
}
