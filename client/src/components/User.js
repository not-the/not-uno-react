// import { socket } from "../socket"

export default function User({ user, game, tagline, title, classes="" }) {
    // const isMe = user.socketID === socket.id;

    let className = `user${tagline?" has_tagline":""}`;
    className += " " + classes;

    return (
        <div className={className} data-title={title}>
            {/* Avatar */}
            <img src={`/avatars/${user.avatar}.png`} alt="" />

            {/* Crown */}
            <span className="crown">
                {(game !== undefined && user.socketID === game?.host) ? "👑" : ""}
            </span>

            <div>
                {/* Username */}
                <span className={`name ${tagline ? " small_name" : null}`}>
                    {user.name}
                </span>

                <p className="tagline">{tagline}</p>
            </div>
        </div>
    )
}