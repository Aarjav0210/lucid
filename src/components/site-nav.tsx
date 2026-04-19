"use client";

import { forwardRef, useEffect } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { getCalApi } from "@calcom/embed-react";

export const CAL_LINK = "aarjav-jain/lucid-bio";

interface SiteNavProps {
  trackLocation?: string;
}

export const SiteNav = forwardRef<HTMLElement, SiteNavProps>(function SiteNav(
  { trackLocation = "nav" },
  ref
) {
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
    <nav
      ref={ref}
      className="sticky top-0 z-50 border-b-4 border-bauhaus-black bg-white"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href="/"
          className="text-xl sm:text-2xl font-black uppercase tracking-tighter hover:opacity-80 transition-opacity"
        >
          Lucid<span className="text-bauhaus-black/40">Bio</span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="mailto:aarjav02@gmail.com"
            className="text-xs font-bold uppercase tracking-widest text-bauhaus-black border-2 border-bauhaus-black px-3 py-1.5 hover:bg-bauhaus-black hover:text-white transition-colors"
          >
            Contact
          </a>
          <button
            data-cal-namespace="intro"
            data-cal-link={CAL_LINK}
            data-cal-config='{"layout":"month_view","theme":"light"}'
            onClick={() => track("book_call_click", { location: trackLocation })}
            className="text-xs font-bold uppercase tracking-widest text-white bg-bauhaus-black border-2 border-bauhaus-black px-3 py-1.5 hover:bg-bauhaus-blue hover:border-bauhaus-blue transition-colors"
          >
            Book a Call
          </button>
        </div>
      </div>
    </nav>
  );
});
