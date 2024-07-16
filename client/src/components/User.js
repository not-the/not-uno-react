import { socket } from "../socket"

export default function User({ user, game, tagline, title, classes="" }) {
    const isMe = user.socketID === socket.id;

    let className = `user${tagline?" has_tagline":""}`;
    className += " " + classes;

    const afterName = isMe ?
        // <span className="after_name">(You)</span>
        <img src="/icons/person.svg" alt="(You)" className="you" />
        : null;

    return (
        <div className={className} data-title={title}>
            {/* Avatar */}
            <img src={`/avatars/${user.avatar}.png`} alt="" className="avatar" />

            {/* Crown */}
            <span className="crown">
                {(game !== undefined && user.socketID === game?.host) ? "👑" : ""}
            </span>

            <div>
                {/* Username */}
                <div className="flex flex_center_vertically">
                    <span className={`name ${tagline ? " small_name" : null}`}>
                        {user.name}
                    </span>
                    {afterName}
                </div>

                <p className="tagline">{tagline}</p>
            </div>
        </div>
    )
}