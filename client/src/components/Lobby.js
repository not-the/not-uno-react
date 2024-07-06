// import { config } from "./App"
import { useState } from "react";
import { socket } from "../socket.js";
import User from "./User.js"

export default function Lobby({ game, startGame }) {

    function shareRoom() {
        // URL PLACEHOLDER
        window.navigator.share({
            url: `https://localhost:3000/#${game.roomID}`,
            text: "Play Not UNO with me!"
        });
    }

    return (
        <>
            {/* Upper */}
            <main id="lobby" className="container">

                <div className="cols_container media_flex">
                    {/* Left */}
                    <div className="col">
                        <h3 className="border_shadowed">
                            Lobby<span className="small">(Room {game.roomID})</span>
                        </h3>

                        {/* Start */}
                        <button className="button_primary button_green border_shadowed" onClick={startGame}>
                            <img src="/icons/play.svg" alt="" className="border_shadowed" />
                            <span className="border_shadowed">
                                START
                            </span>
                        </button>
                        <br/>

                        {/* Share */}
                        <div className="button_primary button_lightbg border_shadowed">
                            <img src="/icons/person.svg" alt="" className="border_shadowed" />
                            <span>
                                <span className="border_shadowed">
                                    Invite your friends:
                                </span>

                                <button className="button_primary button_secondary share_button button_lightbg hover_border_shadowed"
                                    onClick={shareRoom}
                                >
                                    <span>{game.roomID}</span>

                                    <img src="/icons/Share.svg" alt="" className="float_right" />
                                </button>
                            </span>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="col" style={{ "maxWidth": "300px" }}>
                        {/* Players */}
                        <div>
                            <h3 className="border_shadowed">Players</h3>
                            <div className="users_list">
                                {Object.entries(game.usersParsed).map(([, user], index) => {
                                    return <User
                                        key={index} user={user} game={game}
                                        title={`ID: ${user.socketID}
                                        ${user.socketID === game.host ? " (Host)":""}`}
                                    />
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Options */}
            <div id="config" className="container">
                <h2 className="border_shadowed">Options</h2>
                {/* Starting cards */}
                <Config name="starting_cards" game={game} />

                {/* Continue */}
                {/* <div className="item border_shadowed">
                    <label htmlFor="continue_after_win">
                        <h4>Ask if the game should continue when someone wins:</h4>
                        <input type="checkbox" name="continue_after_win" id="continue_after_win" />
                    </label>
                </div> */}

            </div>
        </>
    )
}

function Config({ name, game }) {
    const options = {
        "starting_cards": {
            title: "Starting cards",
            desc: "Number of cards each player starts with",
            icon: "/icons/play.svg",

            type: "number",
            min: 3, max: 12
        }
    }

    const option = options[name];

    function updateConfig(option, value) {
        socket.emit("update_config", { option, value });
    }

    return (
        <div className="item border_shadowed">
            <img src={option.icon} alt="" className="border_shadowed" />
            <label htmlFor="starting_cards">
                <div className="inner media_flex">
                    {/* About */}
                    <div>
                        <h4 className="border_shadowed">{option.title}</h4>
                        <p className="desc">{option.desc}</p>
                    </div>

                    {/* Input */}
                    <div className="input_container border_shadowed margin_left_auto">
                        <Input type={option.type} id={name} min={option.min} max={option.max} initialValue={game.config[name]} updateConfig={updateConfig} />
                    </div>
                </div>
            </label>
            <div className="decorator"/>
        </div>
    )
}

function Input({ type, id, initialValue, min, max, updateConfig }) {
    const [value, setValue] = useState(initialValue);

    function set(v) {
        setValue(old => {
            const newValue = typeof v === 'function' ? v(old) : v;

            if(newValue < min || newValue > max) return old;

            updateConfig(id, newValue);
            document.getElementById(id).value = newValue;

            return newValue;
        });
    }

    if(type === "number") {
        return (
            <>
                <button className="number_input_btn" onClick={() => set(old => old-1)}>
                    -
                </button>
                <input id={id} type="number" min={min} max={max} defaultValue={initialValue} onChange={event => set(Number(event.target.value))} />
                <button className="number_input_btn" onClick={() => set(old => old+1)}>
                    +
                </button>
            </>
        )
    }

    else return <p>(input no type specified)</p>
}

