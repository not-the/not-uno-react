// import { config } from "./App"

export default function Lobby({ game, startGame }) {
    return (
        <div id="lobby">

            <button onClick={startGame}>PLAY</button>
            <br/>
            <br/>

            {/* Players */}
            <div>
                <h2>Players</h2>
                <div id="lobby_users">
                    {Object.entries(game.usersParsed).map(([socketID, user]) => {
                        return (
                            <div className="user">
                                <img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" alt="" />
                                <p>{socketID === game.host ? "👑" : ""}</p>
                                <strong>
                                    {user.name}
                                </strong>
                                <span class="socketid">[{socketID}]</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <br/>
            <br/>


            {/* Options */}
            <div id="config">
                <h2>Options</h2>
                {/* Starting cards */}
                <div className="item">
                    <label htmlFor="starting_cards">
                        <p>Starting cards:</p>
                        <input id="starting_cards" type="number" min="3" max="12" defaultValue="7" />
                    </label>
                </div>

                {/* Starting cards */}
                <div className="item">
                    <label htmlFor="continue_after_win">
                        <p>Ask if the game should continue when someone wins:</p>
                        <input type="checkbox" name="continue_after_win" id="continue_after_win" />
                    </label>
                </div>

            </div>
        </div>
    )
}