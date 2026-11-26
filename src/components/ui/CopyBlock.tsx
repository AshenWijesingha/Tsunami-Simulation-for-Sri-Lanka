"use client";
import { useState } from "react";

export function CopyBlock({ text, label }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-line">
      <div className="flex items-center justify-between border-b border-line bg-panel-2 px-3 py-1.5">
        <span className="eyebrow !text-[0.66rem]">{label}</span>
        <button
          className="btn !px-2 !py-0.5 !text-xs"
          onClick={() =>
            navigator.clipboard?.writeText(text).then(() => {
              setOk(true);
              setTimeout(() => setOk(false), 1500);
            })
          }
        >
          {ok ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-panel p-3 font-mono text-[0.75rem] leading-relaxed text-fg-2">{text}</pre>
    </div>
  );
}
