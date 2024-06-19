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
    // xray: false,
    xray: true,
}


export default function Game() {

    // Current user ID
    var user = {
        id: 0
    };

    // Game
    let [game, setGame] = useState(defaultGame);


    function addPlayer() {
        let modifiedPlayers = game.players.splice();
        modifiedPlayers.push([{hidden:true}]);
        console.log('modified: ', modifiedPlayers);
        setGame({ ...game, players:modifiedPlayers});
        console.log('game: ', game.players);

        // Give cards
        let PID = game.players.length-1;
        repeat(() => moveCard("deck", PID, true), config.starting_cards);
    }

    function moveCard(fromName, toName, unhide) {
        // if(toName === -1) return;

        let modifiedGame = structuredClone(game);

        // Get to/from locations
        let from = typeof fromName === 'number' ?
            modifiedGame.players[fromName] : // Player
            modifiedGame[fromName]; // Location
        let to = typeof toName === 'number' ?
            modifiedGame.players[toName] : // Player
            modifiedGame[toName]; // Location

        console.log(toName);

        // if(to === undefined) return;
        console.log("/ -----------");
        console.log(modifiedGame.players);
        console.log("----------- /");

        // Take card
        let card = from.shift();

        if(card === undefined) return console.warn('Card is undefined'); // Error
        if(unhide) card.hidden = false; // Unhide
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

    // Setup
    useEffect(() => {
        console.log('started: ' + game.started);
        if(!game.started) {
            let modifiedGame = structuredClone(game);
            for(let i in modifiedGame.deck) modifiedGame.deck[i].hidden = true;
            shuffle(modifiedGame.deck); // Shuffle
            console.log(modifiedGame);
            setGame({ ...modifiedGame, started:true });

            // Add players
            addPlayer(); // Player
            addPlayer(); // Player
            moveCard("deck", "pile"); // First card
        }
    }, [])


    // HTML
    return (
        <div id="game">
            {/* Debug */}
            <button onClick={() => addPlayer()}>ADD PLAYER</button>

            <h1>Deck</h1>
            {
                <Card data={{ hidden:true }} onclick={() => moveCard("deck", "pile")} />
            }

            <h1>Pile</h1>
            {
                // game.pile.map((cardData, index) => {
                //     return <Card data={cardData} key={index} />
                // })

                <Card data={game.pile[game.pile.length-1]} />
            }

            <h1>Players</h1>
            {game.players.map((player, playerIndex) => {
                return (
                    <>
                        <h2>Player {playerIndex+1}</h2>
                        <div className="player" key={playerIndex}>
                            {game.players[playerIndex].map((cardData, cardIndex) => {
                                return <Card data={cardData} key={cardIndex} owner={playerIndex} user={user} game={game} />
                            })}
                        </div>
                    </>
                )
            })}
        </div>
    );
}
