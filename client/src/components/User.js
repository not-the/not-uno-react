// import { socket } from "../socket"

export default function User({ user, game, message, title }) {
    // const isMe = user.socketID === socket.id;

    return (
        <div className={`user${message?" user_message":""}`} data-title={title}>
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