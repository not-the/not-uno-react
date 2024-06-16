const icons = {
    "reverse": <img src="/icons/reverse.png" alt="Reverse" />
}


function Icon({ icon }) {
    return (
        <div class="symbol">
            {icons?.[icon] ?? <p>{icon}</p>}
        </div>
    )
}

export default Icon;
