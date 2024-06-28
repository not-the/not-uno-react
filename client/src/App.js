import { useState, useEffect } from 'react'
import Game from './components/Game.js'
import Lobby from './components/Lobby.js'

// Socket.io
import { socket } from './socket.js';


export default function App() {

    // Menu {String}
    let [menu, setMenu] = useState(null);
    let page =
        menu === "game" ? <Game /> :
        menu === "lobby" ? <Lobby /> :
        <h1>Home</h1>


    // Chat
    // const [chatInput, setChatInput] = useState("");

    // const sendChat = () => {
    //     socket.emit("chat", { msg:chatInput });
    //     newChatMsg(chatInput);
    //     setChatInput("");
    // }

    // const newChatMsg = (msg) => {
    //     setChatCache(old => [...old, msg]); // Push new message
    // }

    // // const chatCache = [];
    // const [chatCache, setChatCache] = useState([]);
    // useEffect(() => {
    //     socket.on("chat_receive", (data) => {
    //         newChatMsg(data.msg);
    //     });

    //     // Unmount
    //     return () => {
    //         socket.off("chat_receive");
    //     }
    // }, []);

    return (
        <>
            <nav>
                <button onClick={() => setMenu("home")}>Home</button>
                <button onClick={() => setMenu("lobby")}>Lobby</button>
                <button onClick={() => setMenu("game")}>Game</button>
            </nav>

            {/* <h1>Socket test</h1>
            <input type="text" name="chat_input" id="chat_input" onChange={event => setChatInput(event.target.value)} onKeyDown={event => { if(event.key === "Enter") sendChat() }} />
            <button onClick={sendChat}>Send</button>

            <h3>Messages:</h3>
            <div>
                {chatCache.map((msg, index) => <p key={index}>{msg}</p>)}
            </div> */}

            <main>
                {page}
            </main>
        </>
    );
}
