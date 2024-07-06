
import { useState } from "react";
import { socket } from "../socket";

export default function Config({ name, game }) {
    const options = {
        "starting_cards": {
            title: "Starting cards",
            desc: "Number of cards each player starts with",
            icon: "/icons/play.svg",

            type: "number",
            min: 3, max: 12
        },
        "chat": {
            title: "Chat",
            desc: "Enables the chat menu",

            icon: "/icons/chat.svg",
            type: "boolean"
        },
        "xray": {
            title: "Hands Down",
            desc: "Everyone's cards are visible",

            icon: "/icons/play.svg",
            type: "boolean"
        }
    }

    const option = options[name];

    function updateConfig(option, value) {
        socket.emit("update_config", { option, value });
    }

    return (
        <div className="item border_shadowed">
            <img src={option.icon} alt="" className="border_shadowed" />
            <label htmlFor={name}>
                <div className="inner media_flex">
                    {/* About */}
                    <div>
                        <h4 className="border_shadowed">{option.title}</h4>
                        <p className="desc">{option.desc}</p>
                    </div>

                    {/* Input */}
                    <div className="input_container border_shadowed margin_left_auto">
                        <Input type={option.type} id={name} min={option.min} max={option.max} initialValue={game.config[name]} updateConfig={updateConfig} disabled={socket.id !== game.host} />
                    </div>
                </div>
            </label>
            <div className="decorator"/>
        </div>
    )
}

function Input({ type, id, initialValue, min, max, updateConfig, disabled }) {
    const [value, setValue] = useState(initialValue);

    function set(v) {
        // if(disabled) return;

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
                <input id={id} type="number" min={min} max={max} value={value} onChange={event => set(Number(event.target.value))} />
                <button className="number_input_btn" onClick={() => set(old => old+1)}>
                    +
                </button>
            </>
        )
    }
    else if(type === "boolean") {
        return (
            <input type="checkbox" name={id} id={id} checked={initialValue} onClick={() => set(old => !old)} />
        )
    }

    else return <p>(input no type specified)</p>
}