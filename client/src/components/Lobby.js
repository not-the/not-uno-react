// import { config } from "./App"
import User from "./User.js"

export default function Lobby({ game, startGame }) {
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
                                    Invite your friends
                                </span>

                                <button className="button_primary share_button button_lightbg">
                                    {game.roomID}
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
                                    return <User key={index} user={user} game={game} />
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
                <div className="item border_shadowed">
                    <img src="/icons/play.svg" alt="" className="border_shadowed" />
                    <label htmlFor="starting_cards">
                        <div className="inner">
                            <div>
                                <h4 className="border_shadowed">
                                    Starting cards
                                </h4>
                                <p className="desc">
                                    Number of cards each player starts with
                                </p>
                            </div>
                            <div className="margin_left_auto">
                                <input id="starting_cards" type="number" min="3" max="12" defaultValue="7" />
                            </div>
                        </div>
                    </label>
                    <div className="decorator"/>
                </div>

                {/* Starting cards */}
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