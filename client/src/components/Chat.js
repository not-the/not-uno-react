export default function Chat({ profile, setUsername, chatCache, setChatInput, sendChat }) {
    return (
        <div id="chat">
            <h3>Profile</h3>
            <div>
                Name: <strong>{profile.name}</strong>
            </div>

            <input type="text" name="username_input" id="username_input" placeholder="Username"
                onKeyDown={event => { if(event.key === "Enter") setUsername(event.target.value) }}
            />
            <button onClick={() => setUsername(document.getElementById("username_input").value)}>Set</button>
            <br/>
            <br/>

            <hr />
            <br/>

            <h3>Chat</h3>
            <br/>
            <div className="chat_messages">
                {chatCache.reverse().map((data, index) => <p key={index}>
                    <strong>{data.user.name}</strong> {data.msg}
                </p>)}
            </div>

            <input type="text" name="chat_input" id="chat_input"
                onChange={event => setChatInput(event.target.value)}
                onKeyDown={event => { if(event.key === "Enter") sendChat() }}
            />
            <button onClick={sendChat}>Send</button>
        </div>
    )
}