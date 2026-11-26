import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-elev mt-16">
      <div className="mx-auto max-w-[1240px] px-4 py-10 grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="font-bold text-fg">{SITE.name}</div>
          <p className="note mt-2 max-w-md">
            Research and teaching platform. Not an operational warning service. In an emergency in Sri Lanka, follow official
            instructions from the Department of Meteorology (+94 11 268 6686) and the Disaster Management Centre (hotline 117).
          </p>
          <p className="note mt-2">Version {SITE.version} · open source</p>
        </div>
        <div>
          <div className="eyebrow mb-2">Explore</div>
          <ul className="space-y-1 text-sm">
            <li><Link href="/simulator">Numerical simulator</Link></li>
            <li><Link href="/learn">12-chapter course</Link></li>
            <li><Link href="/impact">Impact &amp; vulnerability</Link></li>
            <li><Link href="/analysis">Uncertainty analysis</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-2">Research</div>
          <ul className="space-y-1 text-sm">
            <li><Link href="/methods">Methods &amp; model card</Link></li>
            <li><Link href="/references">References &amp; data</Link></li>
            <li><Link href="/references#cite">How to cite</Link></li>
            <li><a href={SITE.repo} rel="noopener">Source code</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1240px] px-4 py-4 note">
          Map data © OpenStreetMap contributors (ODbL) · OpenFreeMap · Sentinel-2 cloudless by EOX (CC BY 4.0) · Terrain: Tilezen/Mapzen on AWS Open Data (ETOPO1, SRTM).
        </p>
      </div>
    </footer>
  );
}
