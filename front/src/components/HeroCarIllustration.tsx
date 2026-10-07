type Props = {
  /** Accessible description of the car drawing. */
  label: string;
};

const WHEELS = [200, 600];

/**
 * Static wireframe ("skeleton") side view of a car for the home banner.
 * Stroke-only inline SVG (no external asset, CSP-friendly); colours come from
 * the `.chc-hero-car` rules in globals.css.
 */
export function HeroCarIllustration({ label }: Props) {
  return (
    <svg className="chc-hero-car" viewBox="60 90 690 200" role="img" aria-label={label}>
      {/* Construction lines */}
      <g className="chc-hero-car-guide">
        <line x1="60" y1="276" x2="750" y2="276" />
        <line x1="200" y1="232" x2="600" y2="232" />
        <line x1="200" y1="150" x2="200" y2="276" />
        <line x1="600" y1="150" x2="600" y2="276" />
      </g>

      {/* Body outline */}
      <path d="M80 232 L80 205 Q84 182 120 176 L255 162 Q310 118 370 106 L480 102 Q540 104 590 148 L690 162 Q728 170 730 205 L730 232 L655 232 A55 55 0 0 0 545 232 L255 232 A55 55 0 0 0 145 232 Z" />
      {/* Windows, beltline, door, lights */}
      <path d="M285 160 Q325 124 375 116 L455 113 L460 160 Z" />
      <path d="M476 160 L472 113 Q525 116 562 154 L564 160 Z" />
      <path d="M110 198 L715 198" />
      <path d="M468 162 L468 232" />
      <path d="M704 176 Q722 178 726 192 L706 192 Z" className="chc-hero-car-accent" />
      <path d="M80 186 L92 186 L92 198 L80 198" className="chc-hero-car-accent" />

      {/* Wheels: tyre, rim, spokes, hub */}
      {WHEELS.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="232" r="44" />
          <circle cx={cx} cy="232" r="28" />
          {[0, 72, 144, 216, 288].map((a) => (
            <line
              key={a}
              x1={cx}
              y1="224"
              x2={cx}
              y2="204"
              transform={`rotate(${a} ${cx} 232)`}
            />
          ))}
          <circle cx={cx} cy="232" r="6" className="chc-hero-car-accent" />
        </g>
      ))}
    </svg>
  );
}
