import { useState, useEffect } from 'react'
import Game from './components/Game.js'
import Lobby from './components/Lobby.js'
import Toast from './components/Toast.js'
import { store } from './Util.js'

// Socket.io
import { socket } from './socket.js';

/** App */
export default function App() {

    // Game
    const [game, setGame] = useState(false);
    const [profile, setProfile] = useState({ name:"username", avatar:false });
    const [users, setUsers] = useState({});

    function startGame() {
        socket.emit("start_game");
    }

    // Menu {String}
    const [menu, setMenu] = useState("null");
    const page =
        menu === "game" ? <Game game={game} setGame={setGame} /> : // Game
        menu === "lobby" ? <Lobby game={game} setGame={setGame} startGame={startGame} /> : // Lobby
        null; // Home


    // Chat
    const [chatInput, setChatInput] = useState("");


    const [chatCache, setChatCache] = useState([]);
    function newChatMsg(data) {
        setChatCache(old => [...old, data]); // Push new message
    }

    const sendChat = () => {
        socket.emit("chat", { msg:chatInput });
        // newChatMsg(chatInput);
        setChatInput("");
        document.getElementById("chat_input").value = "";
    }

    const setUsername = (value) => {
        socket.emit("setUser", { name:value });
    }

    const joinRoom = () => {
        // Join room from URL
        let urlRoom = window.location.hash.substring(1);
        if(urlRoom === '') urlRoom = undefined;
        socket.emit("join", urlRoom);
    }

    function debugDataRequest() {
        socket.emit("debug", true);
    }

    const [toasts, setToasts] = useState([]);
    function toast(data) {
        setToasts(old => [...old, data]); // Push new toast

        // Timer
        // Animation
        setTimeout(() => {
            setToasts(old => {
                let index = old.indexOf(data);
                return old.splice(index, 1);
            }); // Remove toast
        }, 6000);

        // Remove
        // setTimeout(() => {
        //     setToasts(old => {
        //         let index = old.indexOf(data);
        //         return old.splice(index, 1);
        //     }); // Remove toast
        // }, 6200);
    }

    useEffect(() => {
        // Auto join from URL
        if(window.location.hash !== '') joinRoom();

        // Pre-existing username
        let myUser = store("user_data");
        if(myUser) {
            socket.emit("setUser", myUser);
        }

        // Receive MSG
        socket.on("chat_receive", (data) => {
            newChatMsg(data);
        });

        // Joined to room
        socket.on("joined", roomID => {
            // Left
            if(!roomID) {
                setMenu("home");
                window.location.hash = '';
                return;
            }

            if(window.location.hash === '') window.location.hash = `#${roomID}`;

            // setMenu("lobby");
        });

        // Toast notification
        socket.on("toast", (data) => {
            toast(data);
        });

        socket.on("gameState", data => {
            setGame(data);

            // User ID
            data.my_num = getPnumFromSocketID(data.players, socket.id);

            console.log(data.players, socket.id);

            /** this also exists serverside? */
            function getPnumFromSocketID(players, socketID) {
                return players.findIndex(p => p.socketID === socketID);
            }

            // Set menu
            if(data.state === 'lobby') setMenu("lobby");
            else setMenu("game");
        })

        socket.on("assignedUserData", data => {
            store("user_data", data);
            setProfile(data);
        })

        // Receive debug data
        socket.on("debug", data => {
            for(const [key, value] of Object.entries(data)) {
                console.log(key);
                console.log(value);
            }
        })

        // Unmount
        return () => {
            socket.off("chat_receive");
            socket.off("join");
            socket.off("toast");
            socket.off("gameState");
            socket.off("assignedUserData");
            socket.off("debug");
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

            {/* Game */}
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

            {/* Chat */}
            <div id="chat">
                <h3>Profile</h3>
                <div>
                    Name: <strong>{profile.name}</strong>
                </div>

                <input type="text" name="username_input" id="username_input" placeholder="Username"
                    onKeyDown={event => { if(event.key === "Enter") setUsername(event.target.value) }}
                />
                <button onClick={() => setUsername(document.getElementById("username_input").value)}>Set</button>
                <br/>
                <br/>

                <hr />
                <br/>

                <h3>Chat</h3>
                <br/>
                <div className="chat_messages">
                    {chatCache.reverse().map((data, index) => <p key={index}>
                        <strong>{data.user.name}</strong> {data.msg}
                    </p>)}
                </div>

                <input type="text" name="chat_input" id="chat_input"
                    onChange={event => setChatInput(event.target.value)}
                    onKeyDown={event => { if(event.key === "Enter") sendChat() }}
                />
                <button onClick={sendChat}>Send</button>
            </div>

            {/* Toasts */}
            <div id="toasts">
                {toasts.map((t, index) => <Toast data={t} key={index} />)}

                {/* Debug tools */}
                <button onClick={debugDataRequest}>Request server data</button>
            </div>
        </>
    );
}
