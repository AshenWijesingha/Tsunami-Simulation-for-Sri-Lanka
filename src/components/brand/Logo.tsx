import { useId } from "react";
import { SITE } from "@/lib/site";
import { MARK_ISLAND_PATH } from "@/lib/geo/mark";

/** The brand mark: a breaking wave approaching Sri Lanka (Natural Earth 1:10m coastline, true aspect ratio). */
export function LogoMark({ size = 36, className = "", title }: { size?: number; className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0A2463" />
          <stop offset=".55" stopColor="#0B5394" />
          <stop offset="1" stopColor="#0EA5C6" />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <rect width="64" height="64" rx="15" />
        </clipPath>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id}g)`} />
      <path d={MARK_ISLAND_PATH} fill="#FFC94A" />
      <g clipPath={`url(#${id}c)`}>
        <path
          d="M-2 64V41c9 0 14-13 27-15 10-1.5 17 5 15 11-1.5 4-7.5 5-9.5 1.5 3 1 5-1 4.5-3-1-3.5-6-4.5-9.5-1.5-6.5 5.5-4 16.5 5 19 8 2 15-4 24-4 4 0 7 1 11 2.5V64z"
          fill="#fff"
        />
        <path d="M-2 64v-5.5c12-3 21 1 32 0 10-1 18-5 36-3V64z" fill="#9ADCF2" />
      </g>
    </svg>
  );
}

/** Mark + wordmark lockup. */
export function Logo({ size = 36, sub = true, region = SITE.region, className = "" }: { size?: number; sub?: boolean; region?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="leading-none">
        <span className="block text-[1.06rem] font-extrabold tracking-tight text-fg">{SITE.brand}</span>
        {sub && <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.16em] text-accent">{region}</span>}
      </span>
    </span>
  );
}
