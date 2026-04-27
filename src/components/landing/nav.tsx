"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { getCalApi } from "@calcom/embed-react";
import { Brand } from "./brand";
import { navLinks } from "./data";
import { CAL_LINK } from "@/components/site-nav";

/** Sticky top navigation for the landing page. */
export function LandingNav() {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "intro" });
      cal("ui", {
        hideEventTypeDetails: false,
        layout: "month_view",
        theme: "light",
      });
    })();
  }, []);

  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <Brand href="/" />
        <div className="nav-links">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="nav-cta">
          <button
            type="button"
            data-cal-namespace="intro"
            data-cal-link={CAL_LINK}
            data-cal-config='{"layout":"month_view","theme":"light"}'
            onClick={() => track("book_call_click", { location: "nav" })}
            className="btn btn-primary"
          >
            Book a call <span className="arr">→</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
