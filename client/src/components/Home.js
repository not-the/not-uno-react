export default function Home({ joinRoom }) {
    return (
        <>
            {/* Main */}
            <main id="home" className="container">
                {/* Buttons */}
                <button className="button_primary border_shadowed" onClick={joinRoom}>
                    <span className="border_shadowed">
                        CREATE LOBBY
                    </span>
                </button>
            </main>

            {/* Footer */}
            <footer id="footer_main" className="container">
                <div className="inner">
                    <strong>Credits:</strong><br/>
                    <a href="https://notkal.com">notkal.com</a>
                </div>
            </footer>
        </>
    )
}