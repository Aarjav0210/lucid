"use client";

import { track } from "@vercel/analytics";
import { AmbientMonitor } from "./ambient-monitor";
import { CAL_LINK } from "@/components/site-nav";

export function Hero() {
  return (
    <header className="hero">
      <div className="wrap hero-grid">
        <div>
          <div className="hero-eyebrow">
            <span className="dot" /> Biosecurity infrastructure
          </div>
          <h1 className="hero-title">
            The complete <em>security</em> layer for biosynthesis.
          </h1>
          <p className="hero-sub">Prevent biosecurity threats before they emerge.</p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="#stacks">
              Explore stacks <span className="arr">→</span>
            </a>
            <button
              type="button"
              data-cal-namespace="intro"
              data-cal-link={CAL_LINK}
              data-cal-config='{"layout":"month_view","theme":"light"}'
              onClick={() => track("book_call_click", { location: "hero" })}
              className="btn btn-outline"
            >
              Book a call
            </button>
          </div>
        </div>
        <div className="hero-side">
          <AmbientMonitor />
        </div>
      </div>
    </header>
  );
}
