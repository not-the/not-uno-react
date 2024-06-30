export default function Toast({ data }) {
    return (
        <div className="toast">
            <div className="inner">
                <h3>{data.title}</h3>
                <p>{data.msg}</p>
            </div>

            <div className="toast_time_bar" style={{ "animationDuration": "6s" }}/>
        </div>
    )
}