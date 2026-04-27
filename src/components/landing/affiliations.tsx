import { affiliations } from "./data";

export function Affiliations() {
  return (
    <section className="section" id="team" style={{ padding: "100px 0" }}>
      <div className="wrap">
        <div className="affil-head">§ 03 — Team</div>
        <div className="affil-row">
          {affiliations.map((a) => (
            <div key={a.name} className="affil">
              <div className="affil-name">{a.name}</div>
              <div className="affil-sub">{a.location}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
