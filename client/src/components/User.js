// import { socket } from "../socket"

export default function User({ user, game, message, title, classes="" }) {
    // const isMe = user.socketID === socket.id;

    let className = `user${message?" user_message":""}`;
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
                <span className={`name ${message ? " small_name" : null}`}>
                    {user.name}
                </span>

                <p className="message">{message}</p>
            </div>
        </div>
    )
}