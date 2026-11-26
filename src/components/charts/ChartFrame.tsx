"use client";
import { useRef, type ReactNode } from "react";
import { download } from "@/lib/format";

/** Resolve CSS variables so an exported SVG renders the same outside the page. */
function inlineVars(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const cs = getComputedStyle(document.documentElement);
  const html = new XMLSerializer().serializeToString(clone);
  return html.replace(/var\((--[a-z0-9-]+)\)/gi, (_, v) => cs.getPropertyValue(v).trim() || "#888");
}

export function ChartFrame({
  title,
  name,
  children,
  caption,
  csv,
  actions,
}: {
  title: string;
  name: string;
  children: ReactNode;
  caption?: ReactNode;
  csv?: () => string;
  actions?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const svg = () => ref.current?.querySelector("svg") as SVGSVGElement | null;
  const saveSvg = () => {
    const s = svg();
    if (s) download(name + ".svg", inlineVars(s), "image/svg+xml");
  };
  const savePng = () => {
    const s = svg();
    if (!s) return;
    const vb = s.viewBox.baseVal;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = vb.width * 2;
      c.height = vb.height * 2;
      const x = c.getContext("2d")!;
      x.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => b && download(name + ".png", b));
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(inlineVars(s));
  };
  return (
    <figure className="card p-4 min-w-0">
      <figcaption className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <h3 className="font-bold text-fg text-[1.02rem]">{title}</h3>
        <div className="flex flex-wrap gap-1.5">
          {actions}
          <button className="btn !min-h-0 !py-1 !px-2 !text-xs" onClick={saveSvg} title="Download vector graphic">
            SVG
          </button>
          <button className="btn !min-h-0 !py-1 !px-2 !text-xs" onClick={savePng} title="Download image">
            PNG
          </button>
          {csv && (
            <button className="btn !min-h-0 !py-1 !px-2 !text-xs" onClick={() => download(name + ".csv", csv(), "text/csv")} title="Download underlying data">
              CSV
            </button>
          )}
        </div>
      </figcaption>
      <div ref={ref}>{children}</div>
      {caption && <div className="note mt-3">{caption}</div>}
    </figure>
  );
}
