"use client";
import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Mode = "system" | "light" | "dark";
const ORDER: Mode[] = ["system", "light", "dark"];
const ICON = { system: Monitor, light: Sun, dark: Moon };
const LABEL = { system: "System theme", light: "Light theme", dark: "Dark theme" };

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
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
  const Icon = ICON[mode];
  const cycle = () => {
    try {
      localStorage.setItem("theme", next);
    } catch {}
    if (next === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new Event("themechange"));
  };
  return (
    <button className="btn btn-ghost !min-h-9 !w-9 !p-0" onClick={cycle} title={`${LABEL[mode]} (switch to ${LABEL[next].toLowerCase()})`} aria-label={`${LABEL[mode]}. Switch to ${LABEL[next].toLowerCase()}`}>
      <Icon size={18} />
    </button>
  );
}

/** Inline script that applies the saved theme before first paint. */
export const THEME_SCRIPT = `try{var m=localStorage.getItem("theme");if(m==="light"||m==="dark")document.documentElement.setAttribute("data-theme",m)}catch(e){}`;
