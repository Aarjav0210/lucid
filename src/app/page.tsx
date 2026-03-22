"use client";

import { useState, useRef, useEffect } from "react";
import { sampleReports } from "@/lib/mock-report";
import { LiveScreening } from "@/components/live-screening";
import { SequenceReport as SequenceReportComponent } from "@/components/report/sequence-report";
import type { SequenceReport as SequenceReportType } from "@/lib/report-types";
import {
  Circle,
  Square,
  Triangle,
  ArrowRight,
  Search,
  Pencil,
} from "lucide-react";

/* ─── Geometric decorations ─── */

function BauhausLogo() {
  return (
    <div className="flex items-center gap-2">
      <Circle className="w-5 h-5 fill-bauhaus-red text-bauhaus-red" />
      <Square className="w-5 h-5 fill-bauhaus-blue text-bauhaus-blue" />
      <Triangle className="w-5 h-5 fill-bauhaus-yellow text-bauhaus-yellow" />
    </div>
  );
}

function DnaHelix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const mouse = { x: -9999, y: -9999 };
    const nucleotides = ["A", "C", "G", "T"];

    // Deterministic letter per position so it doesn't flicker
    const letterFor = (helixIdx: number, strandIdx: number, pointIdx: number) =>
      nucleotides[(helixIdx * 7 + strandIdx * 3 + pointIdx) % 4];

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const helices = [
      { offset: -220, color: "rgba(5,150,105,0.8)", phaseOffset: 0, speed: 0.005 },
      { offset: 0, color: "rgba(232,65,24,0.85)", phaseOffset: 2.1, speed: 0.006 },
      { offset: 220, color: "rgba(255,200,0,0.8)", phaseOffset: 4.2, speed: 0.007 },
    ];

    const draw = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);

      const diagLen = Math.sqrt(w * w + h * h);
      const angle = Math.atan2(h, w);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const amplitude = 50;
      const step = 14;
      const twist = 0.07;

      for (const helix of helices) {
        const numPoints = Math.ceil(diagLen / step) + 6;

        const s1: { x: number; y: number; z: number }[] = [];
        const s2: { x: number; y: number; z: number }[] = [];

        for (let i = -3; i < numPoints; i++) {
          const d = -40 + i * step;
          const phase = i * twist + t * helix.speed + helix.phaseOffset;

          const perp1 = Math.sin(phase) * amplitude + helix.offset;
          const perp2 = Math.sin(phase + Math.PI) * amplitude + helix.offset;
          const z1 = Math.cos(phase);
          const z2 = Math.cos(phase + Math.PI);

          s1.push({ x: d * cosA + perp1 * (-sinA), y: d * sinA + perp1 * cosA, z: z1 });
          s2.push({ x: d * cosA + perp2 * (-sinA), y: d * sinA + perp2 * cosA, z: z2 });
        }

        // Rungs
        for (let i = 0; i < s1.length; i++) {
          if (i % 3 !== 0) continue;
          const p1 = s1[i];
          const p2 = s2[i];
          const avgZ = (p1.z + p2.z) / 2;
          ctx.strokeStyle = avgZ > 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)";
          ctx.lineWidth = avgZ > 0 ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // Strand drawing
        const drawStrand = (points: typeof s1) => {
          ctx.strokeStyle = helix.color;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (i === 0) {
              ctx.moveTo(p.x, p.y);
            } else {
              ctx.lineTo(p.x, p.y);
            }
          }
          ctx.stroke();
        };

        drawStrand(s1);
        drawStrand(s2);

        // Dots that morph into nucleotide letters on hover
        const hoverRadius = 40;
        const helixIdx = helices.indexOf(helix);
        const drawDots = (points: typeof s1, strandIdx: number) => {
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const blend = Math.max(0, 1 - dist / hoverRadius);

            if (blend > 0) {
              // Letter
              const letter = letterFor(helixIdx, strandIdx, i);
              ctx.save();
              ctx.font = `bold ${10 + blend * 6}px monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = `rgba(255,255,255,${blend.toFixed(2)})`;
              ctx.fillText(letter, p.x, p.y);
              ctx.restore();
            }

            // Dot (shrinks as letter appears)
            const dotRadius = (1 - blend) * 3.5;
            if (dotRadius > 0.2) {
              ctx.fillStyle = helix.color;
              ctx.beginPath();
              ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        };

        drawDots(s1, 0);
        drawDots(s2, 1);
      }

      t++;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}



/* ─── Main Page ─── */

export default function Home() {
  const [activeReport, setActiveReport] = useState<SequenceReportType | null>(null);
  const [submittedSequence, setSubmittedSequence] = useState<string | null>(null);
  const [editingSequence, setEditingSequence] = useState(false);
  const [editInput, setEditInput] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const seqHeroRef = useRef<HTMLElement>(null);
  const [stickyOffset, setStickyOffset] = useState(0);

  useEffect(() => {
    const measure = () => {
      const navH = navRef.current?.getBoundingClientRect().height ?? 0;
      const seqH = seqHeroRef.current?.getBoundingClientRect().height ?? 0;
      setStickyOffset(navH + seqH);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [submittedSequence, editingSequence]);

  const riskColors: Record<string, string> = {
    HIGH: "bg-bauhaus-red text-white",
    MEDIUM: "bg-bauhaus-yellow text-bauhaus-black",
    LOW: "bg-emerald-600 text-white",
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* ─── Navigation ─── */}
      <nav ref={navRef} className="sticky top-0 z-50 border-b-4 border-bauhaus-black bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <BauhausLogo />
            <span className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
              Lucid
            </span>
          </div>
          <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
            Sequence Risk Screening
          </span>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section
        className={`overflow-hidden transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          submittedSequence
            ? "max-h-0 opacity-0 pointer-events-none"
            : "max-h-[800px] opacity-100 border-b-4 border-bauhaus-black"
        }`}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
          <div className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
              Screen
              <br />
              <span className="text-bauhaus-blue">Sequences</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl font-medium text-bauhaus-black/70 max-w-lg leading-relaxed">
              Biosecurity screening — InterPro domain analysis, Diamond sequence
              search, ESMfold structure prediction, and FoldSeek structural
              similarity. Cross-referenced against known threat domains.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#screen"
                className="inline-flex items-center gap-2 px-6 py-3 bg-bauhaus-blue text-white font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-bauhaus-blue/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
              >
                Screen a Sequence
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#orders"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-bauhaus-black font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-bauhaus-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
              >
                View Sample Orders
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="hidden lg:block bg-bauhaus-blue relative overflow-hidden border-l-4 border-bauhaus-black">
            <DnaHelix />
          </div>
        </div>
      </section>

      {/* ─── Sequence Hero (shown after submission) ─── */}
      {submittedSequence && (
        <section ref={seqHeroRef} className="sticky top-[68px] z-40 border-b-4 border-bauhaus-black bg-white/85 backdrop-blur-md hover:bg-white transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
                    Screening Sequence
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/30">
                    {submittedSequence.replace(/^>.*\n/, "").replace(/\s+/g, "").length} AA
                  </span>
                </div>
                <p className="font-mono text-sm text-bauhaus-black/50 leading-relaxed break-all line-clamp-2">
                  {submittedSequence.replace(/^>.*\n/, "").replace(/\s+/g, "")}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingSequence(!editingSequence);
                  if (!editingSequence) {
                    setEditInput(submittedSequence);
                  }
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-bauhaus-black/50 border border-bauhaus-black/20 hover:bg-bauhaus-muted/50 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            </div>
            {/* Edit dropdown */}
            {editingSequence && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 font-mono text-sm bg-bauhaus-muted/30 text-bauhaus-black border-2 border-bauhaus-black/20 focus:border-bauhaus-black focus:outline-none resize-y placeholder:text-bauhaus-black/25"
                  spellCheck={false}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingSequence(false);
                      setSubmittedSequence(editInput);
                      window.dispatchEvent(new CustomEvent("lucid:resubmit", { detail: editInput }));
                    }}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-bauhaus-black text-white border-2 border-bauhaus-black hover:bg-bauhaus-black/80 transition-colors"
                  >
                    Resubmit
                  </button>
                  <button
                    onClick={() => setEditingSequence(false)}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-bauhaus-black/50 border border-bauhaus-black/20 hover:bg-bauhaus-muted/50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Live Screening ─── */}
      <section id="screen" className="border-b-4 border-bauhaus-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className={submittedSequence ? "max-w-6xl mx-auto" : "max-w-4xl mx-auto"}>
            {!submittedSequence && (
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-bauhaus-blue flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
                  Screen a Sequence
                </h2>
              </div>
            )}
            <LiveScreening onSequenceSubmit={setSubmittedSequence} stickyOffset={stickyOffset} />
          </div>
        </div>
      </section>

      {/* ─── Sample Orders ─── */}
      <section
        id="orders"
        className="border-b-4 border-bauhaus-black bg-bauhaus-yellow"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/60 mb-4">
            Sample Orders — Select to view screening report
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sampleReports.map((sample) => {
              const risk = sample.report.integratedReport?.overallRisk ?? "LOW";
              const isActive = activeReport?.id === sample.report.id;
              return (
                <button
                  key={sample.report.id}
                  onClick={() => {
                    setActiveReport(sample.report);
                    setTimeout(() => {
                      document.getElementById("report")?.scrollIntoView({ behavior: "smooth" });
                    }, 50);
                  }}
                  className={`group relative text-left p-4 bg-white border-2 border-bauhaus-black shadow-[3px_3px_0px_0px_#121212] sm:shadow-[4px_4px_0px_0px_#121212] hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 ${isActive ? "ring-2 ring-bauhaus-black ring-offset-2" : ""}`}
                >
                  <span className="block font-bold uppercase tracking-wider text-sm">
                    {sample.label}
                  </span>
                  <span className="block mt-1 text-xs font-medium text-bauhaus-black/50 tracking-wider">
                    {sample.description}
                  </span>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border border-bauhaus-black ${riskColors[risk] ?? ""}`}
                  >
                    {risk}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Sample Report View ─── */}
      {activeReport && (
        <section id="report" className="border-b-4 border-bauhaus-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
                Sample Screening Report
              </p>
              <button
                onClick={() => setActiveReport(null)}
                className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40 hover:text-bauhaus-black transition-colors"
              >
                Close
              </button>
            </div>
            <div className="max-w-6xl mx-auto">
              <SequenceReportComponent report={activeReport} />
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer ─── */}
      <footer className="bg-bauhaus-black text-white border-t-4 border-bauhaus-black mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BauhausLogo />
            <span className="text-lg font-black uppercase tracking-tighter">
              Lucid
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 text-center sm:text-right">
            Diamond + ESMfold + FoldSeek + LLM Assessment
            <br />
            US Select Agents & Toxins &middot; Dual-Use Gene Catalog
          </p>
        </div>
      </footer>
    </main>
  );
}
