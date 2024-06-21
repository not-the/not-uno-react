import { useState } from 'react'
import Game from './Game.js'
import Lobby from './Lobby.js'


export default function App() {
    let [menu, setMenu] = useState("lobby");


    let page =
        menu === "game" ? <Game /> :
        menu === "lobby" ? <Lobby /> :
        <h1>Home</h1>

    return (
        <>
            <nav>
                <button onClick={() => setMenu("home")}>Home</button>
                <button onClick={() => setMenu("lobby")}>Lobby</button>
                <button onClick={() => setMenu("game")}>Game</button>
            </nav>

            <main>
                {page}
            </main>
        </>
    );
}
