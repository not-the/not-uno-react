import Icon from "./Icon.js"

export default function Card({ data={} }) {
    return (
        <div className="card"
            style={{ "--card-color": `var(--${data.color})` }}
        >
            <div className="oval"/>

            <Icon icon={data.type} />
        </div>
    )
}