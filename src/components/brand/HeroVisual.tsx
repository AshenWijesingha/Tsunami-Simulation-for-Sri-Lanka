import { C_KMMIN, DONDRA, EPI } from "@/lib/physics/constants";
import { dest, greatCircle, hav, mercY } from "@/lib/physics/geo";
import { REGION_LAND, SRI_LANKA_RINGS_MAP } from "@/lib/geo/coastlines";
import { fmtDur } from "@/lib/format";

/**
 * Geographically accurate hero map (Web Mercator, as in the simulator):
 * Natural Earth coastlines, the 24 Nov 2026 epicentre at its true position, the great-circle
 * path to Dondra Head, and hourly long-wave travel-time circles (geodesic, h = 4 km).
 */
const W = 520,
  H = 420;
const LON0 = 52,
  LON1 = 96;
const K = W / (((LON1 - LON0) * Math.PI) / 180); // px per radian (Mercator)
const LAT_BOTTOM = -22.5;
const Y_BOTTOM = mercY(LAT_BOTTOM);
const X = (lon: number) => (((lon - LON0) * Math.PI) / 180) * K;
const Y = (lat: number) => H - (mercY(lat) - Y_BOTTOM) * K;

const ringPath = (ring: [number, number][]) => ring.map(([lon, lat], i) => `${i ? "L" : "M"}${X(lon).toFixed(1)} ${Y(lat).toFixed(1)}`).join("") + "Z";
const linePath = (pts: [number, number][]) => pts.map(([lon, lat], i) => `${i ? "L" : "M"}${X(lon).toFixed(1)} ${Y(lat).toFixed(1)}`).join("");

/** Geodesic circle of radius r km around the epicentre. */
function circle(rkm: number) {
  const pts: [number, number][] = [];
  for (let b = 0; b <= 360; b += 4) {
    const [lat, lon] = dest(EPI.lat, EPI.lon, b, rkm);
    pts.push([lon, lat]);
  }
  return linePath(pts);
}

const LAND = REGION_LAND.map(ringPath).join("");
const SL = SRI_LANKA_RINGS_MAP.map(ringPath).join("");

export function HeroVisual({ labels }: { labels?: { epicentre: string; region: string; sriLanka: string; travel: string; india: string } }) {
  const L = labels ?? {
    epicentre: "EPICENTRE · M6.5",
    region: "Central Indian Ridge",
    sriLanka: "SRI LANKA",
    travel: "Wavefronts: hourly long-wave travel time (uniform 4 km depth)",
    india: "INDIA",
  };
  const d = hav(EPI.lat, EPI.lon, DONDRA.lat, DONDRA.lon);
  const hours = [1, 2, 3, 4, 5];
  const gc = greatCircle(EPI.lat, EPI.lon, DONDRA.lat, DONDRA.lon, 60);
  const ex = X(EPI.lon),
    ey = Y(EPI.lat);
  const graticuleLon = [60, 70, 80, 90];
  const graticuleLat = [-20, -10, 0, 10];
  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full drop-shadow-[0_30px_60px_rgba(10,36,99,0.35)]" role="img" aria-labelledby="hero-vis-title hero-vis-desc">
        <title id="hero-vis-title">Map: tsunami wavefronts spreading from the Central Indian Ridge toward Sri Lanka</title>
        <desc id="hero-vis-desc">
          Web Mercator map of the Indian Ocean with Natural Earth coastlines. The 24 November 2026 epicentre (17.78° S, 65.82° E) is about{" "}
          {Math.round(d).toLocaleString()} km from Dondra Head, Sri Lanka, along the great circle; hourly circles show long-wave travel time over 4 km depth.
        </desc>
        <defs>
          <linearGradient id="hv-ocean" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#071a47" />
            <stop offset=".55" stopColor="#0A2463" />
            <stop offset="1" stopColor="#0B5394" />
          </linearGradient>
          <radialGradient id="hv-glow" cx={ex / W} cy={ey / H} r=".75">
            <stop offset="0" stopColor="#0EA5C6" stopOpacity=".45" />
            <stop offset="1" stopColor="#0EA5C6" stopOpacity="0" />
          </radialGradient>
          <clipPath id="hv-clip">
            <rect width={W} height={H} rx="28" />
          </clipPath>
        </defs>
        <g clipPath="url(#hv-clip)">
          <rect width={W} height={H} fill="url(#hv-ocean)" />
          <rect width={W} height={H} fill="url(#hv-glow)" />
          {/* graticule */}
          <g stroke="#fff" strokeOpacity=".07" fontFamily="var(--font-sans)" fontSize="9" fill="#9fb8dd">
            {graticuleLon.map((lon) => (
              <g key={lon}>
                <line x1={X(lon)} x2={X(lon)} y1={0} y2={H} />
                <text x={X(lon) + 3} y={H - 6} stroke="none" fillOpacity=".7">
                  {lon}°E
                </text>
              </g>
            ))}
            {graticuleLat.map((lat) => (
              <g key={lat}>
                <line x1={0} x2={W} y1={Y(lat)} y2={Y(lat)} />
                <text x={6} y={Y(lat) - 3} stroke="none" fillOpacity=".7">
                  {lat === 0 ? "0°" : `${Math.abs(lat)}°${lat < 0 ? "S" : "N"}`}
                </text>
              </g>
            ))}
          </g>
          {/* land */}
          <path d={LAND} fill="#2b4a7d" fillOpacity=".75" stroke="#9ADCF2" strokeOpacity=".35" strokeWidth=".6" />
          {/* travel-time wavefronts */}
          {hours.map((h, i) => (
            <path
              key={h}
              d={circle(C_KMMIN * 60 * h)}
              fill="none"
              stroke="#fff"
              strokeWidth="1.6"
              className="isochrone"
              style={{ animationDelay: `${i * 0.9}s` }}
            />
          ))}
          {/* great circle to Dondra Head */}
          <path d={linePath(gc)} fill="none" stroke="#FFC94A" strokeWidth="2" strokeDasharray="5 5" />
          {/* Sri Lanka */}
          <path d={SL} fill="#FFC94A" stroke="#FFC94A" strokeWidth=".4" />
          {/* epicentre */}
          <circle cx={ex} cy={ey} r="12" fill="#FF6B57" fillOpacity=".25" />
          <circle cx={ex} cy={ey} r="5.5" fill="#FF6B57" stroke="#fff" strokeWidth="1.8" />
          {/* labels */}
          <g fontFamily="var(--font-sans)">
            <text x={X(77.2)} y={Y(15.4)} fontSize="10" fontWeight="700" letterSpacing="2" fill="#cfe6f5" fillOpacity=".75" textAnchor="middle">
              {L.india}
            </text>
            <g transform={`translate(${ex - 18} ${ey + 22})`}>
              <rect width="170" height="42" rx="11" fill="#071a47" fillOpacity=".82" stroke="#fff" strokeOpacity=".15" />
              <text x="12" y="18" fontSize="11" fontWeight="700" fill="#FF8A78" letterSpacing="1">
                {L.epicentre}
              </text>
              <text x="12" y="33" fontSize="11" fill="#cfe6f5">
                {L.region}
              </text>
            </g>
            <g transform={`translate(${X(81.6) + 10} ${Y(7.2) - 14})`}>
              <rect width="150" height="42" rx="11" fill="#071a47" fillOpacity=".82" stroke="#fff" strokeOpacity=".15" />
              <text x="12" y="18" fontSize="11" fontWeight="700" fill="#FFC94A" letterSpacing="1">
                {L.sriLanka}
              </text>
              <text x="12" y="33" fontSize="11" fill="#cfe6f5">
                {Math.round(d).toLocaleString("en-US")} km · {fmtDur(d / C_KMMIN)}
              </text>
            </g>
          </g>
        </g>
      </svg>
      <figcaption className="note mt-2 text-center">{L.travel}</figcaption>
    </figure>
  );
}
