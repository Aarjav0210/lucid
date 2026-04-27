"use client";

import { useState, useRef, useEffect } from "react";
import { sampleReports } from "@/lib/mock-report";
import { LiveScreening } from "@/components/live-screening";
import { SequenceReport as SequenceReportComponent } from "@/components/report/sequence-report";
import type { SequenceReport as SequenceReportType } from "@/lib/report-types";
import { Pencil } from "lucide-react";
import { LandingNav, LandingFooter } from "@/components/landing";
import "@/components/landing/landing.css";

/* ─── DNA helix backdrop (recoloured for the landing palette) ─── */
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
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Muted palette tuned to the landing CSS variables.
    const helices = [
      { offset: -150, color: "rgba(60, 80, 100, 0.55)", phaseOffset: 0,    speed: 0.0045 },
      { offset:    0, color: "rgba(80, 140, 170, 0.85)", phaseOffset: 2.1, speed: 0.0055 },
      { offset:  150, color: "rgba(150, 110, 80, 0.55)", phaseOffset: 4.2, speed: 0.0065 },
    ];

    const draw = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);

      const diagLen = Math.sqrt(w * w + h * h);
      const angle = Math.atan2(h, w);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const amplitude = 36;
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

        for (let i = 0; i < s1.length; i++) {
          if (i % 3 !== 0) continue;
          const p1 = s1[i];
          const p2 = s2[i];
          const avgZ = (p1.z + p2.z) / 2;
          ctx.strokeStyle = avgZ > 0 ? "rgba(20,30,40,0.18)" : "rgba(20,30,40,0.08)";
          ctx.lineWidth = avgZ > 0 ? 1.4 : 0.9;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        const drawStrand = (points: typeof s1) => {
          ctx.strokeStyle = helix.color;
          ctx.lineWidth = 2.4;
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

        const hoverRadius = 36;
        const helixIdx = helices.indexOf(helix);
        const drawDots = (points: typeof s1, strandIdx: number) => {
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const blend = Math.max(0, 1 - dist / hoverRadius);

            if (blend > 0) {
              const letter = letterFor(helixIdx, strandIdx, i);
              ctx.save();
              ctx.font = `${10 + blend * 5}px "JetBrains Mono", ui-monospace, monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = `rgba(20,30,40,${(0.55 + blend * 0.35).toFixed(2)})`;
              ctx.fillText(letter, p.x, p.y);
              ctx.restore();
            }

            const dotRadius = (1 - blend) * 2.4;
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

  return <canvas ref={canvasRef} />;
}

/* ─── Screening Page ─── */

const RISK_CLASS: Record<string, string> = {
  HIGH: "risk-pill risk-high",
  MEDIUM: "risk-pill risk-medium",
  LOW: "risk-pill risk-low",
};

export default function ScreeningPage() {
  const [activeReport, setActiveReport] = useState<SequenceReportType | null>(null);
  const [submittedSequence, setSubmittedSequence] = useState<string | null>(null);
  const [editingSequence, setEditingSequence] = useState(false);
  const [editInput, setEditInput] = useState("");
  const seqBarRef = useRef<HTMLElement>(null);
  const [navHeight, setNavHeight] = useState(64);
  const [seqBarHeight, setSeqBarHeight] = useState(0);

  // Measure sticky offsets so anchor scrolling lands beneath the chrome.
  useEffect(() => {
    const measure = () => {
      const navEl = document.querySelector("nav.nav") as HTMLElement | null;
      setNavHeight(navEl?.getBoundingClientRect().height ?? 64);
      setSeqBarHeight(seqBarRef.current?.getBoundingClientRect().height ?? 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [submittedSequence, editingSequence]);

  const stickyOffset = navHeight + seqBarHeight;

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - stickyOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const cleanedSequence =
    submittedSequence?.replace(/^>.*\n/, "").replace(/\s+/g, "") ?? "";

  return (
    <div className="lucid-landing" data-theme="default">
      <LandingNav />

      {/* ─── Hero (collapses once a sequence is submitted) ─── */}
      <header className={`hero screen-hero ${submittedSequence ? "collapsed" : ""}`}>
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <div className="hero-eyebrow">
                <span className="dot" /> Screening · Live
              </div>
              <h1 className="hero-title">
                Screen <em>sequences</em> before synthesis.
              </h1>
              <div className="hero-cta">
                <button
                  type="button"
                  onClick={() => scrollToId("screen")}
                  className="btn btn-primary"
                >
                  Screen a sequence <span className="arr">→</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToId("orders")}
                  className="btn btn-outline"
                >
                  View sample orders
                </button>
              </div>
            </div>
            <div className="hero-side">
              <div className="screen-helix" aria-hidden="true">
                <DnaHelix />
              </div>
            </div>
          </div>

          <div className="screen-pipeline-stack">
            <div className="screen-pipeline">
              <div className="screen-pipeline-head">Pipeline</div>
              <div className="screen-pipeline-row" data-cols="5">
                {["InterPro", "Diamond", "ESMfold", "FoldSeek", "Lucid Agent"].map((name, i) => (
                  <span key={name} className="screen-pipeline-step">
                    <span className="screen-pipeline-step-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {name}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ─── Sticky sequence summary (after submission) ─── */}
      {submittedSequence && (
        <section
          ref={seqBarRef}
          className="screen-seqbar"
          style={{ top: navHeight }}
        >
          <div className="wrap screen-seqbar-inner">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="screen-seqbar-meta">
                <span className="dot" />
                <span>Screening sequence</span>
                <span style={{ color: "var(--ink-2)" }}>·</span>
                <span>{cleanedSequence.length} aa</span>
              </div>
              <p className="screen-seqbar-seq">{cleanedSequence}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!editingSequence) setEditInput(submittedSequence);
                setEditingSequence(!editingSequence);
              }}
              className="btn-mini btn-mini-outline"
            >
              <Pencil style={{ width: 12, height: 12 }} />
              Edit
            </button>
          </div>
          {editingSequence && (
            <div className="wrap">
              <div className="screen-seqbar-edit">
                <textarea
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  rows={5}
                  spellCheck={false}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSequence(false);
                      setSubmittedSequence(editInput);
                      window.dispatchEvent(
                        new CustomEvent("lucid:resubmit", { detail: editInput })
                      );
                    }}
                    className="btn-mini btn-mini-solid"
                  >
                    Resubmit
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSequence(false)}
                    className="btn-mini btn-mini-outline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── Live screening ─── */}
      <section
        id="screen"
        className="section"
        style={{ paddingTop: submittedSequence ? 64 : 96, paddingBottom: 96 }}
      >
        <div className="wrap">
          {!submittedSequence && (
            <div className="section-head">
              <div className="section-num">§ 01 — Screen</div>
              <h2 className="section-title">
                Submit a <em>sequence</em>.
              </h2>
            </div>
          )}
          <div style={{ maxWidth: submittedSequence ? "none" : 760, margin: "0 auto" }}>
            <LiveScreening
              onSequenceSubmit={setSubmittedSequence}
              stickyOffset={stickyOffset}
            />
          </div>
        </div>
      </section>

      {/* ─── Sample orders ─── */}
      <section
        id="orders"
        className="section"
        style={{ paddingTop: 96, paddingBottom: 96, background: "var(--bg-2)" }}
      >
        <div className="wrap">
          <div className="section-head">
            <div className="section-num">§ 02 — Samples</div>
            <h2 className="section-title">
              Pre-loaded <em>orders</em>.
            </h2>
          </div>
          <div className="sample-grid">
            {sampleReports.map((sample) => {
              const risk = sample.report.integratedReport?.overallRisk ?? "LOW";
              const isActive = activeReport?.id === sample.report.id;
              return (
                <button
                  key={sample.report.id}
                  type="button"
                  onClick={() => {
                    setActiveReport(sample.report);
                    setTimeout(() => {
                      const el = document.getElementById("report");
                      if (!el) return;
                      const top =
                        el.getBoundingClientRect().top +
                        window.scrollY -
                        stickyOffset;
                      window.scrollTo({ top, behavior: "smooth" });
                    }, 60);
                  }}
                  className={`sample-card ${isActive ? "is-active" : ""}`}
                >
                  <div className="sample-card-tag">
                    <span>Sample</span>
                    <span className={RISK_CLASS[risk] ?? "risk-pill risk-low"}>
                      {risk}
                    </span>
                  </div>
                  <h3 className="sample-card-name">{sample.label}</h3>
                  <p className="sample-card-desc">{sample.description}</p>
                  <div className="sample-card-foot">
                    <span className="sample-card-launch">
                      View report <span className="arr">→</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Active sample report ─── */}
      {activeReport && (
        <section
          id="report"
          className="section"
          style={{ paddingTop: 96, paddingBottom: 120 }}
        >
          <div className="wrap">
            <div className="section-meta-row">
              <span>Sample screening report</span>
              <button type="button" onClick={() => setActiveReport(null)}>
                Close ×
              </button>
            </div>
            <SequenceReportComponent report={activeReport} />
          </div>
        </section>
      )}

      <LandingFooter />
    </div>
  );
}
