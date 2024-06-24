import Icon from "./Icon.js"
import Card from "./Card.js"
import { shuffle, repeat } from "../Util.js"
import { useEffect, useState } from "react";


// Game
const data = require('../data.json');

const config = {
    deck: "normal",
    starting_cards: 7,

    // allow_continues: false, // Offer to continue game with remaining players after someone wins
    // require_calling_uno: false,
    // call_penalty: 'draw',
    // call_penalty_draw_amount: 2,
    
    draw_until_match: false
}

const defaultGame = {
    started: false,
    state: 'play',
    winner: false,

    deck: structuredClone(data.decks[config.deck]), // Deck you draw from
    pile: [], // Played cards pile

    players: [],
    turn: 0,
    turn_rotation_value: 0,
    direction: 1, // 1 is clockwise
    draw_count: 0, // This turns number of drawn cards

    // Dev tools
    control_everyone: true, // Currently does nothing
    // xray: false,
    xray: true,
}


export default function Game() {

    // State
    // let [dialog, setDialog] = useState(null);
    // let [dialogAction, setDialogAction] = useState(null);

    // Current user ID
    var user = {
        id: 0
    };

    // Game
    let [game, setGame] = useState(structuredClone(defaultGame));

    // Object to modify while setting up game
    let setupGame = structuredClone(game);

    function addPlayer(prevGame) {
        let modifiedGame = prevGame ?? structuredClone(game);
        modifiedGame.dude = true;
        modifiedGame.players.push([]);
        setGame(modifiedGame);

        // Give cards
        let PID = modifiedGame.players.length-1;
        repeat(() => moveCard("deck", PID, false, modifiedGame), config.starting_cards);
    }

    function moveCard(fromName, toName, hidden, prevGame, fromIndex) {
        let modifiedGame = prevGame ?? structuredClone(game);

        // Get to/from locations
        let from = typeof fromName === 'number' ?
            modifiedGame.players[fromName] : // Player
            modifiedGame[fromName]; // Location
        let to = typeof toName === 'number' ?
            modifiedGame.players[toName] : // Player
            modifiedGame[toName]; // Location

        // Take card
        let card = fromIndex === undefined ? from.shift() : from.splice(fromIndex, 1)[0];

        if(card === undefined) return console.warn('Card is undefined'); // Error
        if(hidden !== undefined) card.hidden = hidden; // Unhide
        to.push(card); // Move

        // Empty deck
        if(fromName === 'deck' && modifiedGame.deck.length === 0) {
            console.log('Shuffling pile back into deck');

            // Move cards
            modifiedGame.deck = structuredClone(modifiedGame.pile.slice(0, -1));
            modifiedGame.pile = [ modifiedGame.pile[modifiedGame.pile.length-1] ];

            // Hide/shuffle
            hideAll(modifiedGame.deck);
            shuffle(modifiedGame.deck);
        }

        setGame(modifiedGame);
    }

    /** Tests whether a move is valid
     * @param {Object} card_a 
     * @param {Object} card_b 
     * @returns {Boolean}
     */
    function testCards(card_a, card_b) {
        if(
            card_a.type === card_b.type // Type
            || card_a.color === card_b.color // Color
            || card_a.color === "black"
            || card_b.color === "black"
        ) return true;
        return false;
    }

    let started = false;

    function hideAll(arr) {
        for(let i in arr) arr[i].hidden = true;
        return arr;
    }

    // Setup
    useEffect(() => {
        if(!started) {
            let modifiedGame = setupGame;
            hideAll(modifiedGame.deck);
            shuffle(modifiedGame.deck); // Shuffle
            started = true;
            // setGame({ ...modifiedGame, started:true });

            // Add players
            addPlayer(modifiedGame); // Player
            addPlayer(modifiedGame); // Player
            addPlayer(modifiedGame); // Player
            addPlayer(modifiedGame); // Player
            moveCard("deck", "pile", false, modifiedGame); // First card

            setGame(modifiedGame);
        }

        // Keybinds
        // const keyupHandler = (event) => {
        //     const key = event.key.toUpperCase();
            
        //     if(!isNaN(Number(key))) {
        //         playCard(user.id, Number(key)-1)
        //     }
        // }
        // document.addEventListener('keyup', keyupHandler);

        // return () => {
        //     document.removeEventListener('keyup', keyupHandler);
        // }
    }, [])


    // Uses modulus operator to keep value within amount
    function clamp(value, max) {
        return ((value % max) + max) % max;
    }

    // Player functions
    function drawCard(PID) {
        if(game.turn !== PID) return console.warn(`[Player ${PID}] Not your turn`);

        // Clone
        const modifiedGame = structuredClone(game);

        // 1 draw limit
        // if(!config.draw_until_match && game.draw_count > 0) {

        //     // Test if last drawn card is valid. If not, end turn
        //     const deckTop = game.deck[game.deck.length-1];
        //     const player = game.players[PID];
        //     const playerLast = player[player.length-1]
        //     if(!testCards(deckTop, playerLast)) nextTurn(modifiedGame);

        //     // Update state
        //     setGame(modifiedGame);

        //     return;
        // }

        // Move card
        moveCard("deck", PID, false, modifiedGame);
        modifiedGame.draw_count++;
    }

    // Place card in pile and enact its effects
    function playCard(PID, cardID) {
        if(game.turn !== PID) {
            console.warn(`[Player ${user.id}] Not your turn`);
            return false;
        };

        const modifiedGame = structuredClone(game);

        // Cards
        const playerCard = modifiedGame.players[PID][cardID];
        if(playerCard === undefined) {
            console.warn(`[Player ${user.id}] Card #${cardID} doesn't exist`);
            return false;
        };
        const pileTop = modifiedGame.pile[game.pile.length-1];

        // Test
        if(!testCards(playerCard, pileTop)) {
            console.warn(`[Player ${user.id}] Invalid card`);
            return false;
        }


        const endMove = () => {
            // Play card
            moveCard(PID, "pile", false, modifiedGame, cardID);

            // Prep for next turn
            if(playerCard.reverse) modifiedGame.direction *= -1;
            nextTurn(playerCard.skip, modifiedGame);

            // Next player
            const nextPlayerID = modifiedGame.turn;
            if(playerCard.draw) repeat(() => moveCard("deck", nextPlayerID, false, modifiedGame), playerCard.draw);

            // Update state
            setGame(modifiedGame);
        }


        // Choose color
        // if(playerCard.choose_color) {
        //     setDialog('choose_color');
        //     setDialogAction(function(value) {
        //         playerCard.color = value;
        //         endMove();
        //     });
        // }

        // else
        endMove();
    }

    function nextTurn(skip=0, prevGame) {
        const turnValue = ((1 + skip) * prevGame.direction);
        prevGame.turn = clamp(
            prevGame.turn + turnValue,
            prevGame.players.length
        );
        prevGame.turn_rotation_value += turnValue;
        prevGame.draw_count = 0;
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
                    Player {game.turn+1}'s turn<br/>
                    Deck ({game.deck.length})
                    <Card data={game.deck[game.deck.length-1]} onClick={() => drawCard(game.turn)} />
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
                        <div id="arrow" style={{ "transform": `rotate(${(game.turn_rotation_value-1)*90}deg)` }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 117 116">
                                <path id="Arrow" d="M0,58,59,0V28h58V87H59v29Z" fill="#fff"/>
                            </svg>
                        </div>
                    </div>
                </div>

                <div id="pile">
                    <br/>
                    Pile ({game.pile.length})

                    <Card data={game.pile[game.pile.length-1]} />
                </div>
            </div>

            {/* Players */}
            {game.players.map((player, playerIndex) => {
                const classes = `player position_${clamp(playerIndex-user.id, game.players.length)}`;

                return (
                    <div className={classes} key={playerIndex}>
                        <h2>PLAYER {playerIndex+1}</h2>

                        {/* Cards */}
                        <div className="inner">
                            {player.map((cardData, cardIndex) => {
                                return <Card data={cardData} key={cardIndex}
                                    owner={playerIndex} user={user} game={game}
                                    onClick={function() { playCard(playerIndex, cardIndex) }}
                                />
                            })}
                        </div>
                    </div>
                )
            })}
        </div>

        {/* Dialog */}
        {/* {dialog === 'choose_color' ?
            <div className="dialog">
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
