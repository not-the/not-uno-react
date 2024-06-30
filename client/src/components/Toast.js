export default function Toast({ data, index }) {
    return (
        <div className="toast" key={index}>
            <h3>{data.title}</h3>
            <p>{data.msg}</p>

            <div className="toast_time_bar" style={{ "animationDuration": "6s" }}/>
        </div>
    )
}