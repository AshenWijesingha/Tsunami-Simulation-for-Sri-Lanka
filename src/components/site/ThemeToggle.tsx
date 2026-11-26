"use client";
import { useSyncExternalStore, type ReactNode } from "react";

type Mode = "system" | "light" | "dark";
const ORDER: Mode[] = ["system", "light", "dark"];
const ICON: Record<Mode, ReactNode> = {
  system: (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" />
    </svg>
  ),
  light: (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="3.2" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M3 13l1.1-1.1M11.9 4.1 13 3" />
      </g>
    </svg>
  ),
  dark: (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7z" fill="currentColor" />
    </svg>
  ),
};

function subscribe(cb: () => void) {
  window.addEventListener("themechange", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("themechange", cb);
    window.removeEventListener("storage", cb);
  };
}
function readMode(): Mode {
  try {
    const m = localStorage.getItem("theme") as Mode | null;
    return m && ORDER.includes(m) ? m : "system";
  } catch {
    return "system";
  }
}

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, readMode, () => "system" as Mode);
  const next = () => {
    const m = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    try {
      localStorage.setItem("theme", m);
    } catch {}
    if (m === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", m);
    window.dispatchEvent(new Event("themechange"));
  };
  return (
    <button className="btn !px-2.5" onClick={next} title={`Theme: ${mode} (click to change)`} aria-label={`Theme: ${mode}`}>
      {ICON[mode]}
    </button>
  );
}

/** Inline script that applies the saved theme before first paint. */
export const THEME_SCRIPT = `try{var m=localStorage.getItem("theme");if(m==="light"||m==="dark")document.documentElement.setAttribute("data-theme",m)}catch(e){}`;
