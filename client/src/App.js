import { useState, useEffect } from 'react'
import Home from './components/Home.js'
import Lobby from './components/Lobby.js'
import Game from './components/Game.js'
import Toast from './components/Toast.js'
import Chat from './components/Chat.js'
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

    // Menu {String}
    const [menu, setMenu] = useState("null");
    const page =
        menu === "game" ? <Game game={game} setGame={setGame} /> : // Game
        menu === "lobby" ? <Lobby game={game} setGame={setGame} startGame={startGame} /> : // Lobby
        <Home joinRoom={joinRoom} />; // Home


    // Server communication
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
            console.log(data);

            // State
            setGame(data);

            // // User ID
            // data.my_num = getPnumFromSocketID(data.players, socket.id);

            // console.log(data.players, socket.id);

            // /** this also exists serverside? */
            // function getPnumFromSocketID(players, socketID) {
            //     return players.findIndex(p => p.socketID === socketID);
            // }

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
            {/* Logo */}
            {menu !== "game" ?
                <h1 className="container"><img src="/LOGO@2x.png" alt="NOT UNO" id="main_logo" /></h1> :
                null
            }

            {/* Main Content (Home/Lobby/Game/etc.) */}
            {page}

            {/* Chat */}
            <Chat
                profile={profile} setUsername={setUsername}
                chatCache={chatCache} setChatInput={setChatInput} sendChat={sendChat}
            />
            

            {/* Toasts */}
            <div id="toasts">
                {toasts.map((t, index) => <Toast data={t} key={index} />)}

                {/* Debug tools */}
                <button onClick={debugDataRequest}>Request server data</button>
                <div>
                    <strong>debug:</strong><br/>
                    pnum: {game?.my_num}<br/>
                    socketID: {socket?.id}
                </div>
            </div>
        </>
    );
}
