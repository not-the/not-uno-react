import { useState } from 'react'
import Game from './Game.js'


export default function App() {
    let [menu, setMenu] = useState("game");


    let page =
        menu === "game" ? <Game /> :
        <h1>Home</h1>

    return (
        <>
            <nav>
                <button onClick={() => setMenu("home")}>Home</button>
                <button onClick={() => setMenu("game")}>Game</button>
            </nav>

            <main>
                {page}
            </main>
        </>
    );
}
