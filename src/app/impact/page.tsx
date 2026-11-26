import type { Metadata } from "next";
import Link from "next/link";
import ImpactExplorer from "@/components/impact/ImpactExplorer";
import { Container, PageHeader, Stat } from "@/components/ui/PageHeader";
import { Eq } from "@/components/ui/Tex";
import { TEX } from "@/content/equations";

export const metadata: Metadata = {
  title: "Impact & vulnerability",
  description:
    "What the 2004 Indian Ocean tsunami did to Sri Lanka, what research learned about vulnerability, how warning has changed since, which sources threaten Sri Lanka, and an interactive fragility-based impact explorer.",
};

const TOC = [
  ["record", "The 2004 record"],
  ["why", "Why the impact was so severe"],
  ["research", "What impact research found"],
  ["since", "Warning and policy since 2004"],
  ["sources", "Where the next tsunami could come from"],
  ["explorer", "Impact explorer"],
  ["gaps", "Open research questions"],
] as const;

const MILESTONES: [string, string][] = [
  ["Dec 2004", "Mw 9.1 Sumatra–Andaman earthquake; no Indian Ocean tsunami warning system exists. Waves reach Sri Lanka about 2 h after the earthquake."],
  ["2005", "UNESCO-IOC establishes the Intergovernmental Coordination Group for the Indian Ocean Tsunami Warning and Mitigation System (ICG/IOTWMS)."],
  ["2005", "Sri Lanka Disaster Management Act No. 13 creates the National Council for Disaster Management and the Disaster Management Centre (DMC)."],
  ["2005–06", "Coastal buffer zones declared: 100 m on the south and west coasts, 200 m on the north and east. Reduced to roughly 35–55 m in 2006 amid livelihood and equity concerns."],
  ["2011", "IOTWMS becomes fully operational with Regional Tsunami Service Providers in Australia, India and Indonesia."],
  ["2012", "Mw 8.6 Wharton Basin earthquake: Indian Ocean-wide warnings and evacuations test the system; waves are small (strike-slip)."],
  ["2015", "Sendai Framework for Disaster Risk Reduction 2015–2030 adopted, with targets on early warning and risk information."],
  ["2021–30", "UN Ocean Decade Tsunami Programme: aim for 100 % of at-risk communities to be ‘Tsunami Ready’ by 2030."],
];

const SOURCES: { zone: string; dist: string; mech: string; hazard: string; note: string; link?: string }[] = [
  { zone: "Sunda megathrust (Andaman–Nicobar–Sumatra)", dist: "1,200–2,000 km", mech: "Thrust (subduction)", hazard: "High", note: "Source of 2004. Direct exposure of the east coast; waves wrap around to the south and west.", link: "/simulator?scen=v2004" },
  { zone: "Makran subduction zone", dist: "≈ 2,500–3,000 km", mech: "Thrust (subduction)", hazard: "Low–moderate", note: "1945 Mw 8.1 tsunami in the Arabian Sea. Sri Lanka is partly sheltered by India; outside this model's domain." },
  { zone: "Wharton Basin (intraplate)", dist: "≈ 1,500 km", mech: "Strike-slip", hazard: "Low", note: "2012 Mw 8.6: the largest strike-slip quake recorded, small tsunami.", link: "/simulator?scen=whatif&lat=2.33&lon=93.06&M=8.6&mech=strike&strike=20" },
  { zone: "Central Indian & Carlsberg ridges", dist: "1,500–3,500 km", mech: "Normal / strike-slip", hazard: "Very low", note: "Moderate magnitudes and inefficient mechanisms. The 24 Nov 2026 event.", link: "/simulator?scen=actual" },
  { zone: "Submarine landslides and volcanic sources", dist: "Variable", mech: "Non-seismic", hazard: "Uncertain", note: "Poorly constrained; short-wavelength, dispersive waves. A research gap." },
];

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="Impact & vulnerability"
        title="From wave height to human impact"
        lead="Hazard is only half of risk. This section reviews what the 2004 tsunami did to Sri Lanka, what researchers learned about why some places and people suffered far more than others, and lets you explore how a forecast wave height becomes an expected impact."
      >
        <nav className="mt-6 flex flex-wrap gap-1.5" aria-label="On this page">
          {TOC.map(([id, l]) => (
            <a key={id} href={`#${id}`} className="btn !py-1 !text-xs">
              {l}
            </a>
          ))}
        </nav>
      </PageHeader>

      <Container className="py-10">
        <div className="prose-sci max-w-[860px]">
          <Eq tex={TEX.risk} cap="The standard decomposition of disaster risk (UNDRR terminology)" />
          <p>
            A far-field forecast gives the <b>hazard</b>: the height and timing of waves at the coast. Whether those waves kill, injure or destroy depends on{" "}
            <b>exposure</b> (who and what is in the flood zone, and when) and <b>vulnerability</b> (how buildings, infrastructure and people respond, and
            whether they can get out in time). The 2004 tsunami showed all three at their worst.
          </p>
        </div>

        <section id="record" className="scroll-mt-20 mt-12">
          <h2 className="text-2xl font-extrabold text-fg">The 2004 record in Sri Lanka</h2>
          <p className="mt-2 max-w-[860px] text-fg-2">
            Figures from the first months after the disaster vary between agencies and were revised as missing-person records were resolved. We give ranges
            and name the source rather than a single falsely precise number.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat value="31,000–35,000" label="People killed" sub="incl. several thousand missing; ADB–JBIC–World Bank (2005); later government totals ≈ 35,000" />
            <Stat value="≈ 440,000+" label="People displaced" sub="Joint needs assessment (2005), early 2005" />
            <Stat value="≈ 100,000" label="Houses destroyed" sub="plus tens of thousands damaged (2005 assessment)" />
            <Stat value="≈ US$1 bn" label="Asset damage" sub="≈ 4.5 % of GDP; reconstruction needs ≈ US$1.5–2.2 bn" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat value="≈ 2 h" label="Travel time to the east coast" sub="Goff et al. (2006)" />
            <Stat value="≈ 5–12 m" label="Measured run-up" sub="International Tsunami Survey Team (Liu et al., 2005)" />
            <Stat value="14" label="Coastal districts affected" sub="about two-thirds of the coastline" />
            <Stat value="≈ 900–1,700+" label="Killed on one train" sub="‘Queen of the Sea’ at Peraliya; exact toll unknown" />
          </div>
          <p className="note mt-3">
            Sources: ADB, JBIC &amp; World Bank (2005) <i>Sri Lanka 2005 Post-Tsunami Recovery Program: Preliminary Damage and Needs Assessment</i>; Liu et al.
            (2005); Wijetunge (2005); Goff et al. (2006). Full citations on the <Link href="/references">References</Link> page.
          </p>
        </section>

        <section id="why" className="scroll-mt-20 mt-14 prose-sci max-w-[860px]">
          <h2>Why the impact was so severe</h2>
          <ul>
            <li>
              <b>No warning.</b> There was no Indian Ocean warning system and no national procedure. A two-hour lead time, ample for evacuation, was lost
              entirely.
            </li>
            <li>
              <b>Whole-island exposure.</b> The east coast faced the source directly. The south and south-west coasts, in the island&apos;s geometric
              shadow, were still hit hard because the waves refracted and diffracted around the island and were trapped along the shelf (Liu et al., 2005).
            </li>
            <li>
              <b>Dense coastal settlement.</b> Fishing communities, the coastal railway and the Galle road, tourism and towns lay within a few hundred metres
              of the shore, often on land only a few metres above sea level.
            </li>
            <li>
              <b>Weak structures.</b> Light timber, cadjan and unreinforced masonry houses failed at modest flow depths; reinforced concrete buildings mostly
              survived structurally.
            </li>
            <li>
              <b>Timing and behaviour.</b> A Sunday morning on a holiday weekend put many people on beaches and roads. The leading wave in some places was a
              drawdown, and people walked out onto the exposed seabed. Later waves were larger than the first.
            </li>
          </ul>
        </section>

        <section id="research" className="scroll-mt-20 mt-14 prose-sci max-w-[860px]">
          <h2>What impact research found</h2>
          <h3>Coastal ecosystems: protection with limits</h3>
          <p>
            Early studies reported less damage behind mangroves and coastal forest (Danielsen et al., 2005; Dahdouh-Guebas et al., 2005). Later analyses
            showed that much of this effect was confounded by elevation, distance from the shore and coastal geometry, and that vegetation can attenuate
            moderate tsunamis but not stop large ones (Kerr &amp; Baird, 2007). The consensus: ecosystems are a useful layer in a multi-layer defence, not a
            substitute for warning and evacuation.
          </p>
          <h3>Coral reefs and coral mining</h3>
          <p>
            Field surveys on the south-west coast linked locally higher inundation and damage to gaps in the reef left by coral mining, which let waves
            through with less energy loss (Fernando et al., 2005). Reef health is part of coastal risk.
          </p>
          <h3>Building damage and fragility functions</h3>
          <p>
            Post-tsunami surveys made it possible to fit <b>fragility functions</b>: the probability of a damage state as a function of flow depth (or
            velocity), usually lognormal (Koshimura et al., 2009; Suppasri et al., 2013).
          </p>
          <Eq tex={TEX.fragility} cap="Lognormal fragility: x = flow depth, xₘ = median, β = log-standard deviation, Φ = standard normal CDF" />
          <h3>Who dies: social vulnerability</h3>
          <p>
            Mortality was not evenly shared. Oxfam (2005) documented that in many affected communities women died in markedly greater numbers than men,
            linked to swimming ability, clothing, caring roles and where people were at the time. Children and older people were also over-represented.
            Impact-based warning must reach, and work for, the most vulnerable.
          </p>
          <h3>Recovery and the buffer-zone debate</h3>
          <p>
            Coastal set-back zones reduced future exposure on paper but displaced fishing households from their livelihoods, and were applied unevenly to
            hotels and homes. They were reduced to roughly 35–55 m in 2006 (Brookings Institution, 2015). The lesson for researchers: risk reduction measures have distributional effects
            that must be studied, not assumed.
          </p>
        </section>

        <section id="since" className="scroll-mt-20 mt-14">
          <h2 className="text-2xl font-extrabold text-fg">Warning and policy since 2004</h2>
          <ol className="relative mt-5 max-w-[860px] border-l-2 border-line pl-6">
            {MILESTONES.map(([y, t], i) => (
              <li key={i} className="mb-5">
                <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-accent bg-panel" />
                <div className="eyebrow text-accent">{y}</div>
                <p className="mt-0.5 text-fg-2">{t}</p>
              </li>
            ))}
          </ol>
          <div className="callout callout-info max-w-[860px]">
            <b>The 2026 bulletin in context.</b> A threat-or-no-threat decision issued 65 minutes after a distant M6.5 event, then explained to the public, is
            exactly what this system was built to do. Correct <i>no-threat</i> calls protect livelihoods and preserve trust for the event that matters.
          </div>
        </section>

        <section id="sources" className="scroll-mt-20 mt-14">
          <h2 className="text-2xl font-extrabold text-fg">Where the next tsunami could come from</h2>
          <p className="mt-2 max-w-[860px] text-fg-2">
            A qualitative screening of Indian Ocean source zones for Sri Lanka. A quantitative ranking needs probabilistic tsunami hazard analysis (PTHA),
            which integrates over all sources and their recurrence (Geist &amp; Parsons, 2006; Grezio et al., 2017):
          </p>
          <div className="max-w-[860px]">
            <Eq tex={TEX.ptha} cap="Annual rate of exceeding height h: source rates νᵢ, source-parameter densities fᵢ, conditional exceedance from simulation" />
          </div>
          <div className="card mt-4 overflow-x-auto p-2">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Source zone</th>
                  <th>Distance</th>
                  <th>Mechanism</th>
                  <th>Hazard to Sri Lanka</th>
                  <th className="!text-left">Notes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((s) => (
                  <tr key={s.zone}>
                    <td className="font-semibold">{s.zone}</td>
                    <td>{s.dist}</td>
                    <td>{s.mech}</td>
                    <td>{s.hazard}</td>
                    <td className="!whitespace-normal !text-left min-w-[280px]">{s.note}</td>
                    <td>
                      {s.link && (
                        <Link href={s.link} className="btn !py-0.5 !px-2 !text-xs">
                          Simulate
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note mt-2">Hazard ratings are a qualitative synthesis of the literature (e.g. Okal &amp; Synolakis, 2008), not the output of a PTHA.</p>
        </section>

        <section id="explorer" className="scroll-mt-20 mt-14">
          <h2 className="text-2xl font-extrabold text-fg">Impact explorer</h2>
          <p className="mb-5 mt-2 max-w-[860px] text-fg-2">
            Chain hazard, exposure and vulnerability for the 21 coastal stations. Choose an empirical scenario or use your latest model run, then adjust the
            fragility curves. Try the Sunda source at M9.0 thrust with ×2–3 local amplification and compare with the 2004 record above.
          </p>
          <ImpactExplorer />
        </section>

        <section id="gaps" className="scroll-mt-20 mt-14 prose-sci max-w-[860px]">
          <h2>Open research questions</h2>
          <ol>
            <li>
              <b>Impact-based far-field warning.</b> Can forecast amplitudes be translated in real time into expected impacts (people, buildings, boats,
              ports) that support graded, local decisions instead of island-wide ones?
            </li>
            <li>
              <b>Sri Lanka-specific fragility.</b> Survey-based fragility functions for Sri Lankan building stock and fishing assets, with uncertainty, are
              still scarce in the open literature.
            </li>
            <li>
              <b>Harbour and current hazard.</b> Even sub-threshold waves (0.1–0.3 m) can generate dangerous currents in harbours. Their thresholds for
              Sri Lankan ports are poorly known.
            </li>
            <li>
              <b>Probabilistic hazard for Sri Lanka.</b> A PTHA with Sunda, Makran and intraplate sources, epistemic logic trees and high-resolution
              nearshore modelling.
            </li>
            <li>
              <b>Trust and response.</b> How do repeated no-threat bulletins and false alarms affect evacuation behaviour in the next real event?
            </li>
            <li>
              <b>Nature-based defences.</b> Quantifying the protective value of reefs, dunes and coastal vegetation for realistic tsunami scenarios, as part
              of multi-layer safety.
            </li>
          </ol>
          <p>
            Contributions and collaborations are welcome. See the <Link href="/methods">model card</Link> for how to extend the model, and the{" "}
            <Link href="/references#cite">citation guidance</Link>.
          </p>
        </section>
      </Container>
    </>
  );
}
