import { Fragment, type ReactNode } from "react";

export function KV({ rows, className = "" }: { rows: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <div className={`kv ${className}`}>
      {rows.map(([k, v], i) => (
        <Fragment key={i}>
          <div>{k}</div>
          <div>{v}</div>
        </Fragment>
      ))}
    </div>
  );
}

export function Section({ title, children, right }: { title: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="eyebrow">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function LevelPill({ label, col }: { label: string; col: string }) {
  return (
    <span className="pill" style={{ background: col }}>
      {label}
    </span>
  );
}
