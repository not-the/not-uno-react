// import { config } from "./App"
import { useState } from "react";
import { socket } from "../socket.js";
import User from "./User.js"
import Config from "./Config.js"

export default function Lobby({ game, startGame }) {

    const playerMax = 4;
    const playerCount = Object.keys(game.usersParsed).length;

    function shareRoom() {
        // URL PLACEHOLDER
        window.navigator.share({
            url: `https://localhost:3000/#${game.roomID}`,
            text: "Play Not UNO with me!"
        });
    }

    function leaveGame() {
        socket.emit("leave");
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
                        <button className="button_primary button_green border_shadowed"
                            onClick={startGame}
                            disabled={socket?.id !== game?.host}
                            data-title={socket?.id !== game?.host ? "Ask the host to start the game" : null}
                        >
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
                        <br/>

                        {/* Leave */}
                        <button className="button_primary button_secondary button_lightbg"
                            onClick={leaveGame}
                        >
                            <span>
                                Leave
                            </span>
                        </button>
                    </div>

                    {/* Right */}
                    <div className="col" style={{ "maxWidth": "300px" }}>
                        {/* Players */}
                        <div>
                            {/* Title */}
                            <div className="flex flex_center_vertically">
                                <h3 className="border_shadowed">Players</h3>
                                <h4 className={`player_count margin_left_auto${playerCount >= playerMax ? " full border_shadowed" : ""}`}>
                                    {playerCount}/{playerMax}
                                </h4>
                            </div>

                            {/* List */}
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
                <h3 className="border_shadowed">Options</h3>

                {/* Chat */}
                <Config name="public_lobby" game={game} />

                {/* Deck */}
                <Config name="starting_deck" game={game} />

                {/* Starting cards */}
                <Config name="starting_cards" game={game} />

                {/* Hands down */}
                <Config name="xray" game={game} />

                {/* Chat */}
                <Config name="enable_chat" game={game} />
            </div>
        </>
    )
}
