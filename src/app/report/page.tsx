"use client";

import { useState } from "react";
import { SequenceReport } from "@/components/report/sequence-report";
import { mockRicinReport, mockSrcReport } from "@/lib/mock-report";
import { SiteNav } from "@/components/site-nav";

type MockKey = "ricin" | "src";

export default function ReportPreview() {
  const [active, setActive] = useState<MockKey>("ricin");

  const reports: Record<MockKey, typeof mockRicinReport> = {
    ricin: mockRicinReport,
    src: mockSrcReport,
  };

  return (
    <main className="min-h-screen flex flex-col">
      <SiteNav trackLocation="nav_report" />

      {/* Toggle */}
      <section className="border-b-4 border-bauhaus-black bg-bauhaus-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/60 mb-3">
            Select Mock Report
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setActive("ricin")}
              className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wider border-2 border-bauhaus-black shadow-[3px_3px_0px_0px_#121212] transition-all duration-200 ${
                active === "ricin"
                  ? "bg-bauhaus-red text-white translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_0px_#121212]"
                  : "bg-white text-bauhaus-black hover:-translate-y-0.5"
              }`}
            >
              Ricin (HIGH Risk)
            </button>
            <button
              onClick={() => setActive("src")}
              className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wider border-2 border-bauhaus-black shadow-[3px_3px_0px_0px_#121212] transition-all duration-200 ${
                active === "src"
                  ? "bg-bauhaus-blue text-white translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_0px_#121212]"
                  : "bg-white text-bauhaus-black hover:-translate-y-0.5"
              }`}
            >
              c-Src Kinase (LOW Risk)
            </button>
          </div>
        </div>
      </section>

      {/* Report */}
      <section className="border-b-4 border-bauhaus-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SequenceReport report={reports[active]} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bauhaus-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-black uppercase tracking-tighter">
              Lucid
            </span>
            <span className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
              <img src="/Brown University Icon.png" alt="Brown University" className="h-5 w-auto opacity-40 grayscale brightness-200" />
              <img src="/UPenn Shield Icon.png" alt="University of Pennsylvania" className="h-5 w-auto opacity-40 grayscale brightness-200" />
              <img src="/Yale Bulldogs Logo.png" alt="Yale University" className="h-5 w-auto opacity-40 grayscale brightness-200" />
              <img src="/Kings College London Icon.png" alt="King's College London" className="h-5 w-auto opacity-40 grayscale brightness-200" />
            </span>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">
              InterPro + Diamond + ESMFold + Foldseek + LLM
            </p>
            <a
              href="mailto:aarjav02@gmail.com"
              className="px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-white/40 text-white/70 hover:bg-white hover:text-bauhaus-black transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
