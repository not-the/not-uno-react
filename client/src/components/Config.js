
import { useState } from "react";
import { socket } from "../socket";

/** Config item */
export default function Config({ name, game }) {
    const options = {
        "starting_deck": {
            title: "Deck",
            desc: "Game version",
            icon: "/icons/play.svg",

            type: "dropdown",
            dropdown: ["normal", "all_wilds", "stupid"]
        },
        "starting_cards": {
            title: "Starting cards",
            desc: "Number of cards each player starts with",
            icon: "/icons/play.svg",

            type: "number",
            min: 3, max: 12
        },
        "enable_chat": {
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
                        <Input
                            option={option}
                            id={name}
                            configValue={game.config[name]}
                            updateConfig={updateConfig}
                            disabled={socket.id !== game.host}
                        />
                    </div>
                </div>
            </label>
            <div className="decorator"/>
        </div>
    )
}

/** Inputs */
function Input({ id, option, configValue, updateConfig, disabled }) {
    const [localValue, setValue] = useState(configValue);

    const { type, min, max } = option;

    function set(v) {
        console.log(id, v);
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
        const buttonDown = <button className="number_input_btn" onClick={() => set(old => old-1)}>
            -
        </button>;
        const input = <input id={id} type="number" min={min} max={max} value={configValue} onChange={event => set(Number(event.target.value))} disabled />;
        const buttonUp = <button className="number_input_btn" onClick={() => set(old => old+1)}>
            +
        </button>;

        return (
            <>
                {disabled ? null : buttonDown}
                {input}
                {disabled ? null : buttonUp}
            </>
        )
    }
    else if(type === "boolean") {
        return (
            <div className="toggle" aria-disabled={disabled}>
                <input type="checkbox" name={id} id={id} checked={configValue} onClick={() => set(old => !old)} disabled={disabled} />
                <span className="border_shadowed" />
            </div>
        )
    }

    else if(type === "dropdown") {
        return (
            <select name={id} id={id} value={configValue} onChange={event => set(event.target.value)}>
                {option.dropdown.map(item => {
                    return <option value={item}>{item}</option>
                })}
            </select>
        )
    }

    else return <p>(input no type specified)</p>
}