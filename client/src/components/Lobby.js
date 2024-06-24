// import { config } from "./App"

export default function Lobby() {
    return (
        <div id="lobby">


            <div id="config">
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