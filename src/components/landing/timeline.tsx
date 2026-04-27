import { timelineEvents } from "./data";

/** Horizontal timeline shown beneath the mission statement. */
export function Timeline() {
  return (
    <div className="timeline">
      <div className="timeline-head">
        <div className="timeline-head-label">·· How we got here</div>
        <div className="timeline-head-note">
          Five decades of biology compounding faster than the safeguards around it.
        </div>
      </div>
      <div className="timeline-track">
        {timelineEvents.map((event, i) => {
          const classes = [
            "tl-event",
            event.position,
            event.current ? "tl-now" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div key={`${event.year}-${i}`} className={classes}>
              <div className="tl-content">
                <span className="tl-year">{event.year}</span>
                <h4 className="tl-title">{event.title}</h4>
                <p className="tl-desc">{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
