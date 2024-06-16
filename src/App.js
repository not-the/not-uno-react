import Icon from "./Icon.js";
import Card from "./Card.js";


function App() {
    return (
        <>
            <h1>hello world</h1>

            <Card data={{ "color": "red", "type": "reverse" }} />
            <Card data={{ "color": "yellow", "type": "5" }} />
            <Card data={{ "color": "green", "type": "5" }} />
            <Card data={{ "color": "blue", "type": "5" }} />
            <Card data={{ "color": "black", "type": "5" }} />



        </>
    );
}

export default App;
