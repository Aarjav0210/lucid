import { Timeline } from "./timeline";

export function Mission() {
  return (
    <section className="mission" id="mission">
      <div className="wrap">
        <div className="section-head">
          <div className="section-num">§ 01 — Mission</div>
          <div />
        </div>
        <div className="mission-inner">
          <p className="mission-lede">
            Build the <em>security infrastructure</em> that scales with biology&apos;s
            potential.
          </p>
          <span className="mission-mark" />
          <p className="mission-coda">
            So breakthrough science doesn&apos;t become a{" "}
            <em>breakthrough threat</em>.
          </p>
        </div>
        <Timeline />
      </div>
    </section>
  );
}
