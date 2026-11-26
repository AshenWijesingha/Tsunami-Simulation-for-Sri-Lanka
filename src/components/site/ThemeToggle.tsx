"use client";
import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { fmt } from "@/i18n/config";
import { useT } from "@/i18n/client";

type Mode = "system" | "light" | "dark";
const ORDER: Mode[] = ["system", "light", "dark"];
const ICON = { system: Monitor, light: Sun, dark: Moon };

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
  const LABEL = useT().nav.theme;
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
    <button className="btn btn-ghost !min-h-9 !w-9 !p-0" onClick={cycle} title={`${LABEL[mode]} · ${fmt(LABEL.switchTo, { mode: LABEL[next] })}`} aria-label={`${LABEL[mode]}. ${fmt(LABEL.switchTo, { mode: LABEL[next] })}`}>
      <Icon size={18} />
    </button>
  );
}

/** Inline script that applies the saved theme before first paint. */
export const THEME_SCRIPT = `try{var m=localStorage.getItem("theme");if(m==="light"||m==="dark")document.documentElement.setAttribute("data-theme",m)}catch(e){}`;
