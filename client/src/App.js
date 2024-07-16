import { useState, useEffect } from 'react'
import Home from './components/Home.js'
import Lobby from './components/Lobby.js'
import Game from './components/Game.js'
import Toast from './components/Toast.js'
import Chat from './components/Chat.js'
import User from './components/User.js'
import { store, arrRandom, capitalizeFirstLetter } from './Util.js'

// Socket.io
import { socket, isProduction } from './socket.js'

// Game
const clientData = require('./clientData.json');

/** App */
export default function App() {

    // Game
    const [game, setGame] = useState(false);
    const [profile, setProfile] = useState({ name:"username", avatar:"balloon" });
    // const [users, setUsers] = useState({});

    /** Emits start_game event */
    function startGame() {
        socket.emit("start_game");
    }

    // Chat
    const [chatInput, setChatInput] = useState("");


    const [chatUnread, setChatUnread] = useState(0);

    const [chatCache, setChatCache] = useState([]);
    const [chatBubble, setChatBubble] = useState(undefined);
    // const [chatBubbleTimeout, setChatBubbleTimeout] = useState(undefined);
    function newChatMsg(data, open) {
        setChatCache(old => {
            let newArr = [data, ...old];

            // Clump messages from same user together
            for(let i in newArr) {
                const item = newArr[i];
                const prev = newArr[i - 1];
                if(item?.socketID === prev?.socketID && prev !== undefined) prev.clump = true;
            }

            return newArr;
        }); // Push new message

        console.log(open);

        // Bubble
        if(!open) {
            setChatBubble(data);
            setChatUnread(old => old+1);
            
        }
    }

    const [chatOpen, setChatOpen] = useState(false);
    function toggleChat() {
        setChatOpen(old => {
            // Opening
            if(!old) {
                document.getElementById("chat_input").focus();
            }

            return !old
        });

        // Clear bubble
        setChatBubble(undefined);
        setChatUnread(0);
    }

    const sendChat = () => {
        if(game === false) return;

        socket.emit("chat", { msg:chatInput });
        // newChatMsg(chatInput);
        setChatInput("");
        document.getElementById("chat_input").value = "";
    }

    const setUser = (name=profile.name, avatar=profile.avatar) => {
        socket.emit("setUser", { name, avatar });
    }

    function joinRoom(roomID) {
        if(roomID === '') roomID = undefined;

        socket.emit("join", roomID);
        setMenu("joining");
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
        menu === "joining" ? <Joining game={game} setMenu={setMenu} /> : // Lobby
    <Home joinRoom={joinRoom} />; // Home

    const [profileOpen, setProfileOpen] = useState(false);

    function randomName() {
        const adjective = capitalizeFirstLetter(arrRandom(clientData.names.adjectives));
        const noun = arrRandom(clientData.names.nouns);
        return `${adjective} ${noun}`;
    }

    // Server communication
    useEffect(() => {
        // Auto join from URL
        if(window.location.hash !== '') joinRoom(window.location.hash.substring(1));

        // Pre-existing username
        let myUser = store("user_data") ?? { name: randomName() };
        socket.emit("setUser", myUser);

        // Receive MSG
        socket.on("chat_receive", data => {
            newChatMsg(data, chatOpen);
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
        });

        // Join failed
        socket.on("join_failed", () => {
            setMenu("home");
            window.location.hash = '';
        })

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
            if(data === false) {
                setMenu(null);
                window.location.hash = "";
            }
            else if(data.state === 'lobby') setMenu("lobby");
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
            socket.off("join_failed");
            socket.off("toast");
            socket.off("gameState");
            socket.off("assignedUserData");
            socket.off("debug");
            window.location.hash = '';
        }
    }, []);

    return (
        <>
            {/* Header */}
            {menu !== "game" ?
                <header className="container flex">
                    {/* Logo */}
                    <h1><img src="/LOGO@2x.png" alt="NOT UNO" id="main_logo" /></h1>

                    {/* Footer */}
                    {/* <footer id="footer_main" className="margin_left_auto">
                        <div className="inner">
                            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Minus, excepturi? Corporis soluta aspernatur, deserunt nesciunt et blanditiis unde obcaecati temporibus?
                        </div>
                    </footer> */}
                </header>
                : null
            }

            {/* Main Content (Home/Lobby/Game/etc.) */}
            {page}

            {/* Chat */}
            <div className={`chat_container ${chatOpen ? "open" : null}`}>
                <Chat
                    game={game}
                    chatOpen={chatOpen} setChatOpen={setChatOpen}
                    profile={profile} setUser={setUser}
                    chatCache={chatCache}
                    chatInput={chatInput} setChatInput={setChatInput}
                    sendChat={sendChat}
                    setProfileOpen={setProfileOpen}
                />
                <button id="chat_button" className="border_shadowed" onClick={toggleChat}>
                    <img src="/icons/chat.svg" alt="Chat" />
                    <span>{chatUnread > 9 ? "9+" : chatUnread || null}</span>

                    {/* Bubble */}
                    {chatBubble ?
                        <div className="bubble">
                            <strong>{chatBubble.user.name}</strong>
                            <span>{chatBubble.msg}</span>
                        </div>
                        : null
                    }

                    
                </button>
            </div>

            {/* Backdrop */}
            <div className="backdrop"/>

            {/* Profile dialog */}
            {profileOpen ?
                <div id="profile" className="dialog border_shadowed">
                    <h3 className="border_shadowed">Profile</h3>
    
                    {/* Preview */}
                    <User user={profile} />
                    <br/><hr/><br/>
    
                    {/* Name */}
                    <label htmlFor="profile_name">
                        <h5>Username</h5>
                        <div className="cols_container gap_12px">
                            <input className="input_primary"
                                type="text" name="username_input" id="username_input"
                                placeholder="Username"
                                onKeyDown={event => { if(event.key === "Enter") setUser(event.target.value) }}
                            />

                            {/* Random username */}
                            <button
                                className="button_primary button_secondary button_comp button_micro"
                                onClick={() => document.getElementById("username_input").value = randomName()}
                                data-title="Random"
                            >
                                <img src="/icons/casino_24dp_E8EAED_FILL1_wght400_GRAD200_opsz20.svg" alt="Random" />
                            </button>

                            {/* Set */}
                            <button
                                className="button_primary button_secondary button_comp button_mini"
                                onClick={() => setUser(document.getElementById("username_input").value)}
                            >
                                Set
                            </button>
                        </div>
                    </label>
                    <br/><br/><hr/><br/>
    
                    {/* Avatar */}
                    <h5>Avatar</h5>
                    <div className="avatar_list">
                        {clientData.avatars.map((name, index) => {
                            return (
                                <button data-title={capitalizeFirstLetter(name)} key={index}
                                    onClick={() => setUser(undefined, name)}
                                >
                                    <img src={`/avatars/${name}.png`} alt={name} className="avatar_preview" />
                                </button>
                            )
                        })
                            
                        }
                    </div>
    
                    <br/><hr/><br/>
    
                    {/* Done */}
                    <button className="button_primary button_secondary button_comp" onClick={() => setProfileOpen(false)}>
                        Done
                    </button>
                </div>
                : null
            }

            

            {/* Toasts */}
            <div id="toasts">
                {toasts.map((t, index) => <Toast data={t} key={index} />)}

                {/* Debug tools */}
                {!isProduction ? <>
                    <div className="pointer_events_none">
                        <strong>debug:</strong><br/>
                        pnum: {game?.my_num}<br/>
                        socketID: {socket?.id}
                    </div>
                    {/* <button onClick={debugDataRequest}>Request server data</button> */}
                </> : null}
            </div>
        </>
    );
}


function Joining({ game, setMenu }) {
    return (
        <div className="container">
            <h2 className="border_shadowed">Joining...</h2>
            <br/>

            <button
                className="button_primary button_secondary button_lightbg hover_border_shadowed"
                onClick={() => setMenu(false)}
            >
                Cancel
            </button>
        </div>
    )
}
