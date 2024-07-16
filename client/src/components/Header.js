export default function Header() {
    return (
        <header className="container flex flex_center_vertically media_flex">
            {/* Logo */}
            <h1><img src="/LOGO@2x.png" alt="NOT UNO" id="main_logo" /></h1>

            {/* Footer */}
            <footer id="footer_main">
                <div className="inner">
                    <strong>Credits:</strong><br/>
                    <a href="https://notkal.com" target="_blank" rel="noreferrer">notkal.com</a>
                </div>
            </footer>
        </header>
    )
}