import type { Metadata } from "next";
import { REFS, TOPICS, type Ref } from "@/content/references";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { SITE } from "@/lib/site";
import { CopyBlock } from "@/components/ui/CopyBlock";

export const metadata: Metadata = {
  title: "References & data",
  description: "Bibliography with DOIs, data sources, software licences and citation guidance for the Indian Ocean Tsunami Lab.",
};

const BIBTEX = `@software{indian_ocean_tsunami_lab,
  title   = {Indian Ocean Tsunami Lab: far-field tsunami hazard for Sri Lanka},
  author  = {Wijesingha, Ashen and contributors},
  version = {${SITE.version}},
  year    = {2026},
  url     = {${SITE.repo}},
  note    = {Linear shallow-water model, empirical forecasts, uncertainty and impact analysis}
}`;

export default function Page() {
  const groups = Object.keys(TOPICS) as Ref["topic"][];
  return (
    <>
      <PageHeader eyebrow="References" title="References, data and citation" lead="Everything the platform relies on, with DOIs where they exist. Software and data licences are listed so results can be reused correctly." />
      <Container className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {groups.map((g) => {
            const rs = REFS.filter((r) => r.topic === g);
            if (!rs.length) return null;
            return (
              <section key={g} className="mb-8">
                <h2 className="mb-3 text-lg font-bold text-fg">{TOPICS[g]}</h2>
                <ol className="space-y-2.5">
                  {rs.map((r) => (
                    <li key={r.key} id={r.key} className="scroll-mt-20 text-[0.92rem] leading-relaxed text-fg-2">
                      {r.text}{" "}
                      {r.doi && (
                        <a href={`https://doi.org/${r.doi}`} rel="noopener" className="whitespace-nowrap">
                          doi:{r.doi}
                        </a>
                      )}
                      {r.url && !r.doi && (
                        <a href={r.url} rel="noopener">
                          Link
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
        <aside className="space-y-5">
          <div id="cite" className="card scroll-mt-20 p-5">
            <div className="eyebrow mb-2">How to cite</div>
            <p className="text-sm text-fg-2">
              If you use this platform in teaching or research, please cite the software and the version, and describe the scenario with its permalink
              (Simulator → Share) and run metadata (JSON export).
            </p>
            <CopyBlock text={BIBTEX} label="BibTeX" />
          </div>
          <div className="card p-5">
            <div className="eyebrow mb-2">Data</div>
            <ul className="space-y-2 text-sm text-fg-2">
              <li>
                <b>Bathymetry:</b> Tilezen/Mapzen Terrain Tiles (AWS Open Data, Terrarium encoding; ocean depths from ETOPO1), sampled at zoom 5 and
                block-averaged to the grid. Offline fallback: GLOBCOVER-based coastline mask with idealised shelf/slope/abyssal depths.
              </li>
              <li>
                <b>Coastal elevations:</b> Copernicus GLO-90 DEM via the Open-Meteo elevation API.
              </li>
              <li>
                <b>Basemaps:</b> OpenFreeMap (© OpenStreetMap contributors, ODbL), OpenStreetMap raster tiles, Sentinel-2 cloudless 2016 by EOX (CC BY 4.0).
              </li>
            </ul>
          </div>
          <div className="card p-5">
            <div className="eyebrow mb-2">Software</div>
            <ul className="space-y-1.5 text-sm text-fg-2">
              <li>Next.js and React (MIT)</li>
              <li>MapLibre GL JS (BSD-3-Clause)</li>
              <li>KaTeX (MIT)</li>
              <li>Zustand (MIT)</li>
            </ul>
          </div>
        </aside>
      </Container>
    </>
  );
}
