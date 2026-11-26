import katex from "katex";

function render(tex: string, display: boolean) {
  return katex.renderToString(tex, { displayMode: display, throwOnError: false, output: "htmlAndMathml", strict: "ignore" });
}

/** Display equation with optional caption (server-rendered KaTeX). */
export function Eq({ tex, cap, label }: { tex: string | string[]; cap?: React.ReactNode; label?: string }) {
  const parts = Array.isArray(tex) ? tex : [tex];
  return (
    <div className="eq" role="figure" aria-label={label ?? cap?.toString()}>
      {parts.map((t, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: render(t, true) }} />
      ))}
      {cap && <span className="cap">{cap}</span>}
    </div>
  );
}

/** Inline math. */
export function M({ t }: { t: string }) {
  return <span dangerouslySetInnerHTML={{ __html: render(t, false) }} />;
}
