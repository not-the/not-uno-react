// import Icon from "./Icon.js"
import Card from "./Card.js"
import { shuffle, repeat, clamp } from "../Util.js"
// import { useEffect, useState } from "react";
import { socket } from "../socket.js";



export default function Game({ game, setGame }) {

    // State
    // let [dialog, setDialog] = useState(null);
    // let [dialogAction, setDialogAction] = useState(null);

    // Setup
    // useEffect(() => {
    //     // Keybinds
    //     const keyupHandler = (event) => {
    //         const key = event.key.toUpperCase();
            
    //         if(!isNaN(Number(key))) {
    //             playCard(game.my_num, Number(key)-1)
    //         }
    //     }
    //     document.addEventListener('keyup', keyupHandler);

    //     return () => {
    //         document.removeEventListener('keyup', keyupHandler);
    //     }
    // }, [])

    // Only works with 4 players
    const arrowRotation = (game.turn_rotation_value-1-game.my_num)*90;

    // Player functions
    function drawCard() {
        socket.emit("drawCard");
    }

    // Place card in pile and enact its effects
    function playCard(cardID) {
        socket.emit("playCard", cardID);
    }

    // function runDialogAction(value) {
    //     console.log(value);
    //     if(dialogAction) dialogAction(value);
    //     setDialog(null);
    //     setDialogAction(null)
    // }


    // HTML
    return (
        <>
        {/* Game container */}
        <div id="game">
            <div id="game_center">
                <div id="deck">
                    {/* Player {game.turn+1}'s turn<br/>
                    Deck ({game.deck.length}) */}
                    <Card data={game.deck[game.deck.length-1]} onClick={() => drawCard()} />
                    <div className="card_stack" style={{ "height": `${game.deck.length/4}px` }} />
                </div>

                {/* Middle */}
                <div className="middle">
                    {/* Rotation */}
                    <div id="rotation" style={{ "transform": `rotate(${game.turn_rotation_value*45}deg) scale(${game.direction}, 1)` }}>
                        ↻
                    </div>

                    {/* Arrow */}
                    <div className="arrow_container">
                        <div id="arrow" style={{ "transform": `rotate(${arrowRotation}deg)` }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 117 116">
                                <path id="Arrow" d="M0,58,59,0V28h58V87H59v29Z" fill="#fff"/>
                            </svg>
                        </div>
                    </div>

                    {/* Extra */}
                    <div class="turn">
                        P{game.turn+1}
                    </div>
                </div>

                <div id="pile">
                    {/* <br/>
                    Pile ({game.pile.length}) */}

                    <Card data={game.pile[game.pile.length-1]} />
                </div>
            </div>

            {/* Players */}
            {game.players.map((player, playerIndex) => {
                const classes = `
                player
                position_${clamp(playerIndex-game.my_num, game.players.length)}
                ${playerIndex === game.my_num ? "me" : ""}
                `;

                return (
                    <div className={classes} key={playerIndex}>
                        <h2>PLAYER {playerIndex+1}</h2>

                        {/* Cards */}
                        <div className="inner">
                            {player.cards.map((cardData, cardIndex) => {
                                return <Card data={cardData} key={cardIndex}
                                    owner={playerIndex} game={game}
                                    onClick={playerIndex === game.my_num ? function() { playCard(cardIndex) } : undefined}
                                />
                            })}
                        </div>
                    </div>
                )
            })}
        </div>

        {/* Dialog */}
        {/* {dialog === 'choose_color' ?
            <div className="dialog toast">
                <h3>CHOOSE A COLOR</h3>
                <div className="choose_color_container">
                    <div className="red" role="button" tabIndex="0" onClick={runDialogAction("red")} />
                    <div className="yellow" role="button" tabIndex="0" onClick={runDialogAction("red")} />
                    <div className="green" role="button" tabIndex="0" onClick={runDialogAction("red")} />
                    <div className="blue" role="button" tabIndex="0" onClick={runDialogAction("red")} />
                </div>
            </div>
        : null
        } */}
        </>
    );
}
