const icons = {
    "reverse": <img src="/icons/reverse.png" alt="Reverse" />,
    "skip": <img src="/icons/skip.png" alt="Skip" />,
    "draw2": <img src="/icons/draw2.png" alt="Draw 2" />,
    "draw4": <img src="/icons/draw4.png" alt="Draw 4" />,
    "wild": <img src="/icons/wild.png" alt="WILD" />,
}


export default function Icon({ icon, className="" }) {
    const underlined = icon === '6' || icon === '9';
    const small_text = icon.length > 2;

    return (
        <div className={`symbol ${className}`}>
            {
                icons?.[icon]
                ??
                <p className={
                    (underlined ? 'underline' : '') +
                    (small_text ? ' small_text' : '')
                }>
                    {icon}
                </p>
            }
        </div>
    )
}
