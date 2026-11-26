import { C_KMMIN, DONDRA, EPI } from "@/lib/physics/constants";
import { hav } from "@/lib/physics/geo";
import { fmtDur } from "@/lib/format";

/**
 * Decorative but faithful illustration: wavefronts spreading from the 24 Nov 2026 epicentre
 * toward Sri Lanka along the great circle. Animation respects prefers-reduced-motion.
 */
export function HeroVisual() {
  const d = hav(EPI.lat, EPI.lon, DONDRA.lat, DONDRA.lon);
  const ex = 120,
    ey = 330; // epicentre in the illustration
  const rings = [0, 1, 2, 3, 4];
  return (
    <figure className="relative">
      <svg
        viewBox="0 0 520 420"
        className="h-auto w-full drop-shadow-[0_30px_60px_rgba(10,36,99,0.35)]"
        role="img"
        aria-labelledby="hero-vis-title hero-vis-desc"
      >
        <title id="hero-vis-title">Tsunami waves spreading from the Central Indian Ridge toward Sri Lanka</title>
        <desc id="hero-vis-desc">
          Concentric wavefronts radiate from the epicentre of the 24 November 2026 earthquake and travel about {Math.round(d).toLocaleString()} km to Sri
          Lanka.
        </desc>
        <defs>
          <linearGradient id="hv-ocean" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#071a47" />
            <stop offset=".55" stopColor="#0A2463" />
            <stop offset="1" stopColor="#0B5394" />
          </linearGradient>
          <radialGradient id="hv-glow" cx=".23" cy=".79" r=".7">
            <stop offset="0" stopColor="#0EA5C6" stopOpacity=".55" />
            <stop offset="1" stopColor="#0EA5C6" stopOpacity="0" />
          </radialGradient>
          <pattern id="hv-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#fff" strokeOpacity=".06" />
          </pattern>
          <clipPath id="hv-clip">
            <rect width="520" height="420" rx="28" />
          </clipPath>
        </defs>
        <g clipPath="url(#hv-clip)">
          <rect width="520" height="420" fill="url(#hv-ocean)" />
          <rect width="520" height="420" fill="url(#hv-grid)" />
          <rect width="520" height="420" fill="url(#hv-glow)" />
          {/* static faint isochrones */}
          {[80, 160, 240, 320, 400].map((r) => (
            <circle key={r} cx={ex} cy={ey} r={r} fill="none" stroke="#9ADCF2" strokeOpacity=".14" strokeDasharray="3 7" />
          ))}
          {/* animated wavefronts */}
          {rings.map((i) => (
            <circle
              key={i}
              className="ripple"
              cx={ex}
              cy={ey}
              r={420}
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              style={{ animationDelay: `${i * 1.2}s` }}
            />
          ))}
          {/* great-circle path */}
          <path d={`M${ex + 10} ${ey - 6} Q 300 300 410 210`} fill="none" stroke="#FFC94A" strokeWidth="2" strokeDasharray="6 6" opacity=".9" />
          {/* Sri Lanka (same outline as the logo, scaled) */}
          <g transform="translate(138 18) scale(6)">
            <path
              d="M43.2 7.1L41 8l1 1.4-1.1 2.8-1.3 4.8.6 3.7.4 4 2.4 5.5 2.8.7 3.6-1.2 2.8-1.7 2.3-2.7-.9-5.4-3.3-5.2-2.9-4.2-2.6-1.4z"
              fill="#FFC94A"
              stroke="#FFC94A"
              strokeWidth=".8"
              strokeLinejoin="round"
            />
          </g>
          {/* epicentre */}
          <circle cx={ex} cy={ey} r="16" fill="#FF6B57" fillOpacity=".25" />
          <circle cx={ex} cy={ey} r="7" fill="#FF6B57" stroke="#fff" strokeWidth="2" />
          {/* labels */}
          <g fontFamily="var(--font-sans)" fill="#fff">
            <g transform={`translate(${ex - 92} ${ey + 34})`}>
              <rect width="184" height="46" rx="12" fill="#071a47" fillOpacity=".75" stroke="#fff" strokeOpacity=".15" />
              <text x="14" y="20" fontSize="12" fontWeight="700" fill="#FF8A78" letterSpacing="1.2">
                EPICENTRE · M6.5
              </text>
              <text x="14" y="36" fontSize="12" fill="#cfe6f5">
                Central Indian Ridge
              </text>
            </g>
            <g transform="translate(330 226)">
              <rect width="170" height="46" rx="12" fill="#071a47" fillOpacity=".75" stroke="#fff" strokeOpacity=".15" />
              <text x="14" y="20" fontSize="12" fontWeight="700" fill="#FFC94A" letterSpacing="1.2">
                SRI LANKA
              </text>
              <text x="14" y="36" fontSize="12" fill="#cfe6f5">
                {Math.round(d).toLocaleString()} km · {fmtDur(d / C_KMMIN)}
              </text>
            </g>
          </g>
        </g>
      </svg>
    </figure>
  );
}
