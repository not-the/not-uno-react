import Icon from "./Icon.js"
import Card from "./Card.js"
import { shuffle, repeat } from "./Util.js"
import { useEffect, useState } from "react";


const data = require('./data.json');

const config = {
    starting_cards: 7
}

const defaultGame = {
    started: false,

    deck: data.deck.slice(), // Deck you draw from (.slice() method clones instead of references)
    pile: [], // Played cards pile

    players: [],
    turn: 0,
    direction: 1, // 1 is clockwise

    // Dev tools
    control_everyone: true,
    // xray: false,
    xray: true,
}


export default function Game() {

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

    function moveCard(fromName, toName, hidden, prevGame) {
        let modifiedGame = prevGame ?? structuredClone(game);

        // Get to/from locations
        let from = typeof fromName === 'number' ?
            modifiedGame.players[fromName] : // Player
            modifiedGame[fromName]; // Location
        let to = typeof toName === 'number' ?
            modifiedGame.players[toName] : // Player
            modifiedGame[toName]; // Location

        // Take card
        let card = from.shift();

        if(card === undefined) return console.warn('Card is undefined'); // Error
        if(hidden !== undefined) card.hidden = hidden; // Unhide
        to.push(card); // Move

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

    // Setup
    useEffect(() => {
        console.log('started: ' + game.started);
        if(!started) {
            let modifiedGame = setupGame;
            for(let i in modifiedGame.deck) modifiedGame.deck[i].hidden = true;
            shuffle(modifiedGame.deck); // Shuffle
            started = true;
            // setGame({ ...modifiedGame, started:true });

            // Add players
            addPlayer(modifiedGame); // Player
            addPlayer(modifiedGame); // Player
            moveCard("deck", "pile", false, modifiedGame); // First card

            setGame(modifiedGame);

            console.log('gaming');
        }
    }, [])



    // Player functions
    function drawCard() {
        if(game.turn !== user.id) return console.warn(`[Player ${user.id}] Not your turn`);

        moveCard("deck", user.id, false);
    }

    // Place card in pile and enact its effects
    function playCard(PID, cardID) {
        if(game.turn !== user.id) return console.warn(`[Player ${user.id}] Not your turn`);

        console.log(game.players[PID][cardID]);

        // if(testCards())
    }


    // HTML
    return (
        <div id="game">
            {/* Debug */}
            <button onClick={() => addPlayer()}>ADD PLAYER</button>
            <button onClick={() => moveCard("deck", "pile", false)}>Card from deck -&gt; pile</button>

            <h1>Deck ({game.deck.length})</h1>
            {
                <Card data={game.deck[game.deck.length-1]} onClick={drawCard} />
            }

            <h1>Pile</h1>
            <div id="pile">
            {
                // game.pile.map((cardData, index) => {
                //     return <Card data={cardData} key={index}
                //         rotation={(Math.floor(Math.random() * 90)) - 45}
                //     />
                // })

                <Card data={game.pile[game.pile.length-1]} />
            }
            </div>

            <h1>Players</h1>
            {game.players.map((player, playerIndex) => {
                return (
                    <>
                        <h2>Player {playerIndex+1}{playerIndex === user.id ? ' (YOU)' : null}</h2>
                        <div className="player" key={playerIndex}>
                            {game.players[playerIndex].map((cardData, cardIndex) => {
                                return <Card data={cardData} key={cardIndex}
                                    owner={playerIndex} user={user} game={game}
                                    onClick={() => playCard(playerIndex, cardIndex)}
                                />
                            })}
                        </div>
                    </>
                )
            })}
        </div>
    );
}
