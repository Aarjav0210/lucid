"use client";

import { useEffect, useRef, useState } from "react";

interface StructureViewerProps {
  pdbString?: string;
  pdbUrl?: string;
  plddtMean: number;
  height?: number;
}

export function StructureViewer({ pdbString, pdbUrl, plddtMean, height = 300 }: StructureViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [pdbData, setPdbData] = useState<string | null>(pdbString ?? null);

  useEffect(() => {
    if (pdbString) {
      setPdbData(pdbString);
      return;
    }
    if (!pdbUrl) return;
    let cancelled = false;
    fetch(pdbUrl)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`PDB fetch failed: ${r.status}`))))
      .then((text) => {
        if (!cancelled) setPdbData(text);
      })
      .catch(() => {
        if (!cancelled) setPdbData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pdbString, pdbUrl]);

  useEffect(() => {
    if (!containerRef.current || !pdbData) return;

    import("3dmol").then(($3Dmol) => {
      if (!containerRef.current) return;

      containerRef.current.innerHTML = "";

      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: "white",
        antialias: true,
      });

      viewer.addModel(pdbData, "pdb");

      viewer.setStyle({}, {
        cartoon: {
          colorfunc: (atom: any) => {
            const b = atom.b > 1 ? atom.b : atom.b * 100;
            if (b >= 90) return "rgb(0, 83, 214)";
            if (b >= 70) return "rgb(101, 203, 243)";
            if (b >= 50) return "rgb(255, 219, 19)";
            return "rgb(255, 125, 69)";
          },
        },
      });

      viewer.zoomTo();
      viewer.render();
      viewer.spin("y", 0.5);
      viewerRef.current = viewer;
      setLoaded(true);
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.clear();
        viewerRef.current = null;
      }
    };
  }, [pdbData]);

  return (
    <div className="border border-[color:var(--lc-rule)] bg-[color:var(--lc-bg)]">
      <div
        ref={containerRef}
        style={{ width: "100%", height: `${height}px`, position: "relative" }}
      />
      {loaded && (
        <div className="px-3 py-2 bg-[color:var(--lc-bg-2)] border-t border-[color:var(--lc-rule)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--lc-ink-3)]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgb(0, 83, 214)" }} />
              &gt;90
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgb(101, 203, 243)" }} />
              70–90
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgb(255, 219, 19)" }} />
              50–70
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgb(255, 125, 69)" }} />
              &lt;50
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-2)]">
            pLDDT {plddtMean.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
