import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, lead, children }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b border-line bg-elev">
      <div className="mx-auto max-w-[1200px] px-4 py-10 md:py-14">
        {eyebrow && <div className="eyebrow text-accent mb-2">{eyebrow}</div>}
        <h1 className="text-3xl md:text-[2.6rem] font-extrabold tracking-tight text-fg leading-[1.1] max-w-4xl text-balance">{title}</h1>
        {lead && <p className="mt-4 max-w-3xl text-lg text-fg-2 leading-relaxed text-pretty">{lead}</p>}
        {children}
      </div>
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1200px] px-4 ${className}`}>{children}</div>;
}

export function Stat({ value, label, sub }: { value: ReactNode; label: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-extrabold tabular-nums text-fg">{value}</div>
      <div className="mt-1 text-sm font-semibold text-fg-2">{label}</div>
      {sub && <div className="note mt-1">{sub}</div>}
    </div>
  );
}

export function Cite({ children }: { children: ReactNode }) {
  return <span className="text-muted">({children})</span>;
}
