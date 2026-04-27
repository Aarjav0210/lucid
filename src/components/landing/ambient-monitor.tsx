import { radarThreats } from "./data";

/**
 * Decorative "radar sweep" SVG that anchors the hero on the right.
 * Each animation runs entirely in CSS (see landing.css), so this is a
 * pure-presentation server component.
 */
export function AmbientMonitor() {
  // Perimeter ticks every 30°. Major ticks at the four cardinal points.
  const tickAngles: { angle: number; major: boolean }[] = [
    { angle: 0, major: true },
    { angle: 30, major: false },
    { angle: 60, major: false },
    { angle: 90, major: true },
    { angle: 120, major: false },
    { angle: 150, major: false },
    { angle: 180, major: true },
    { angle: 210, major: false },
    { angle: 240, major: false },
    { angle: 270, major: true },
    { angle: 300, major: false },
    { angle: 330, major: false },
  ];

  return (
    <div className="ambient" aria-hidden="true">
      <svg viewBox="0 0 360 360">
        <defs>
          {/* Gradient runs from the bearing's leading edge (top-right) and fades
              toward the trailing tail (bottom-left), creating a comet trail. */}
          <linearGradient
            id="lucid-trail-stroke"
            x1="1"
            y1="0"
            x2="0"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.75" />
            <stop offset="0.35" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle className="ring r1" cx="180" cy="180" r="50" />
        <circle className="ring r2" cx="180" cy="180" r="95" />
        <circle className="ring r3" cx="180" cy="180" r="140" />
        <circle className="ring r4" cx="180" cy="180" r="172" />

        <line className="crosshair" x1="180" y1="8" x2="180" y2="352" />
        <line className="crosshair" x1="8" y1="180" x2="352" y2="180" />

        <g>
          {tickAngles.map(({ angle, major }) => (
            <line
              key={angle}
              className={major ? "tick major" : "tick"}
              x1="180"
              y1="4"
              x2="180"
              y2="12"
              transform={angle === 0 ? undefined : `rotate(${angle} 180 180)`}
            />
          ))}
        </g>

        <g className="bearing">
          <path className="trail-arc" d="M 180 8 A 172 172 0 0 0 8 180" />
          <line className="bearing-line" x1="180" y1="180" x2="180" y2="8" />
        </g>

        {radarThreats.map((threat) => (
          <g key={threat.id}>
            <g
              className={`threat ${threat.id}`}
              data-label={threat.label}
              tabIndex={0}
              role="button"
              aria-label={threat.label}
            >
              <circle className="threat-ping" cx={threat.cx} cy={threat.cy} r="3.5" />
              <circle className="threat-halo" cx={threat.cx} cy={threat.cy} r="8" />
              <circle className="threat-core" cx={threat.cx} cy={threat.cy} r="3" />
            </g>
            <text className="threat-label" x={threat.labelX} y={threat.labelY}>
              {threat.label}
            </text>
          </g>
        ))}

        <circle cx="180" cy="180" r="2.2" fill="var(--ink)" />
      </svg>
    </div>
  );
}
