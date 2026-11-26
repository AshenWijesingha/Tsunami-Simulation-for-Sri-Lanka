export interface Ref {
  key: string;
  text: string;
  doi?: string;
  url?: string;
  topic: "event" | "source" | "numerics" | "empirical" | "validation" | "impact" | "hazard" | "data" | "policy";
}

export const REFS: Ref[] = [
  { key: "DoM2026", topic: "event", text: "Department of Meteorology, Sri Lanka (2026). No Tsunami Threat Bulletin, No. 02, issued 24/11/2026 05:41 PM." },
  { key: "Abe1981", topic: "empirical", text: "Abe, K. (1981). Physical size of tsunamigenic earthquakes of the northwestern Pacific. Physics of the Earth and Planetary Interiors, 27, 194–205.", doi: "10.1016/0031-9201(81)90016-9" },
  { key: "Abe1989", topic: "empirical", text: "Abe, K. (1989). Estimate of tsunami heights from magnitudes of earthquake and tsunami. Bulletin of the Earthquake Research Institute, University of Tokyo, 64(1), 51–69." },
  { key: "Comer1980", topic: "empirical", text: "Comer, R. P. (1980). Tsunami height and earthquake magnitude: theoretical basis of an empirical relation. Geophysical Research Letters, 7(6), 445–448.", doi: "10.1029/GL007i006p00445" },
  { key: "Wells1994", topic: "source", text: "Wells, D. L. & Coppersmith, K. J. (1994). New empirical relationships among magnitude, rupture length, rupture width, rupture area, and surface displacement. Bulletin of the Seismological Society of America, 84(4), 974–1002." },
  { key: "Hanks1979", topic: "source", text: "Hanks, T. C. & Kanamori, H. (1979). A moment magnitude scale. Journal of Geophysical Research, 84(B5), 2348–2350.", doi: "10.1029/JB084iB05p02348" },
  { key: "Kajiura1963", topic: "source", text: "Kajiura, K. (1963). The leading wave of a tsunami. Bulletin of the Earthquake Research Institute, University of Tokyo, 41, 535–571." },
  { key: "Okada1985", topic: "source", text: "Okada, Y. (1985). Surface deformation due to shear and tensile faults in a half-space. Bulletin of the Seismological Society of America, 75(4), 1135–1154." },
  { key: "Green1838", topic: "numerics", text: "Green, G. (1838). On the motion of waves in a variable canal of small depth and width. Transactions of the Cambridge Philosophical Society, 6, 457–462." },
  { key: "Goto1997", topic: "numerics", text: "Goto, C., Ogawa, Y., Shuto, N. & Imamura, F. (1997). Numerical method of tsunami simulation with the leap-frog scheme (TUNAMI-N1/N2). IOC Manuals and Guides No. 35, UNESCO." },
  { key: "Lay2005", topic: "validation", text: "Lay, T. et al. (2005). The great Sumatra–Andaman earthquake of 26 December 2004. Science, 308(5725), 1127–1133.", doi: "10.1126/science.1112250" },
  { key: "Titov2005", topic: "validation", text: "Titov, V., Rabinovich, A. B., Mofjeld, H. O., Thomson, R. E. & González, F. I. (2005). The global reach of the 26 December 2004 Sumatra tsunami. Science, 309(5743), 2045–2048.", doi: "10.1126/science.1114576" },
  { key: "Liu2005", topic: "validation", text: "Liu, P. L.-F., Lynett, P., Fernando, H., Jaffe, B. E., Fritz, H., Higman, B., Morton, R., Goff, J. & Synolakis, C. (2005). Observations by the International Tsunami Survey Team in Sri Lanka. Science, 308(5728), 1595.", doi: "10.1126/science.1110730" },
  { key: "Goff2006", topic: "validation", text: "Goff, J., Liu, P. L.-F., Higman, B., Morton, R., Jaffe, B. E., Fernando, H., Lynett, P., Fritz, H., Synolakis, C. & Fernando, S. (2006). Sri Lanka field survey after the December 2004 Indian Ocean tsunami. Earthquake Spectra, 22(S3), 155–172.", doi: "10.1193/1.2205897" },
  { key: "Wijetunge2005", topic: "validation", text: "Wijetunge, J. J. (2005). Indian Ocean tsunami on 26 December 2004: distribution of tsunami height and inundation along the coastline of Sri Lanka. Journal of the National Science Foundation of Sri Lanka, 33(2), 61–68." },
  { key: "Rabinovich2007", topic: "validation", text: "Rabinovich, A. B. & Thomson, R. E. (2007). The 26 December 2004 Sumatra tsunami: analysis of tide gauge data from the world ocean. Part 1. Indian Ocean and South Africa. Pure and Applied Geophysics, 164, 261–308.", doi: "10.1007/s00024-006-0164-5" },
  { key: "USGS2012", topic: "source", text: "U.S. Geological Survey (2013). Mw 8.6 Sumatran earthquake of 11 April 2012: rare seaward expression of oblique subduction (small tsunami waves recorded around the Indian Ocean)." },
  { key: "Synolakis2006", topic: "hazard", text: "Synolakis, C. E. & Bernard, E. N. (2006). Tsunami science before and beyond Boxing Day 2004. Philosophical Transactions of the Royal Society A, 364(1845), 2231–2265.", doi: "10.1098/rsta.2006.1824" },
  { key: "Okal2008", topic: "hazard", text: "Okal, E. A. & Synolakis, C. E. (2008). Far-field tsunami hazard from mega-thrust earthquakes in the Indian Ocean. Geophysical Journal International, 172(3), 995–1015.", doi: "10.1111/j.1365-246X.2007.03674.x" },
  { key: "Geist2006", topic: "hazard", text: "Geist, E. L. & Parsons, T. (2006). Probabilistic analysis of tsunami hazards. Natural Hazards, 37, 277–314.", doi: "10.1007/s11069-005-4646-z" },
  { key: "Grezio2017", topic: "hazard", text: "Grezio, A. et al. (2017). Probabilistic tsunami hazard analysis: multiple sources and global applications. Reviews of Geophysics, 55(4), 1158–1198.", doi: "10.1002/2017RG000579" },
  { key: "Behrens2021", topic: "hazard", text: "Behrens, J. et al. (2021). Probabilistic tsunami hazard and risk analysis: a review of research gaps. Frontiers in Earth Science, 9, 628772.", doi: "10.3389/feart.2021.628772" },
  { key: "Satake2014", topic: "hazard", text: "Satake, K. (2014). Advances in earthquake and tsunami sciences and disaster risk reduction since the 2004 Indian Ocean tsunami. Geoscience Letters, 1, 15.", doi: "10.1186/s40562-014-0015-7" },
  { key: "Danielsen2005", topic: "impact", text: "Danielsen, F. et al. (2005). The Asian tsunami: a protective role for coastal vegetation. Science, 310(5748), 643.", doi: "10.1126/science.1118387" },
  { key: "Dahdouh2005", topic: "impact", text: "Dahdouh-Guebas, F. et al. (2005). How effective were mangroves as a defence against the recent tsunami? Current Biology, 15(12), R443–R447.", doi: "10.1016/j.cub.2005.06.008" },
  { key: "Kerr2007", topic: "impact", text: "Kerr, A. M. & Baird, A. H. (2007). Natural barriers to natural disasters. BioScience, 57(2), 102–103.", doi: "10.1641/B570202" },
  { key: "Fernando2005", topic: "impact", text: "Fernando, H. J. S., McCulley, J. L., Mendis, S. G. & Perera, K. (2005). Coral poaching worsens tsunami destruction in Sri Lanka. Eos, Transactions AGU, 86(33), 301–304.", doi: "10.1029/2005EO330002" },
  { key: "Koshimura2009", topic: "impact", text: "Koshimura, S., Oie, T., Yanagisawa, H. & Imamura, F. (2009). Developing fragility functions for tsunami damage estimation using numerical model and post-tsunami data from Banda Aceh, Indonesia. Coastal Engineering Journal, 51(3), 243–273.", doi: "10.1142/S0578563409002004" },
  { key: "Suppasri2013", topic: "impact", text: "Suppasri, A. et al. (2013). Building damage characteristics based on surveyed data and fragility curves of the 2011 Great East Japan tsunami. Natural Hazards, 66, 319–341.", doi: "10.1007/s11069-012-0487-8" },
  { key: "Oxfam2005", topic: "impact", text: "Oxfam International (2005). The tsunami's impact on women. Oxfam Briefing Note, March 2005." },
  { key: "ADB2005", topic: "impact", text: "Asian Development Bank, Japan Bank for International Cooperation & World Bank (2005). Sri Lanka 2005 Post-Tsunami Recovery Program: Preliminary Damage and Needs Assessment. Colombo.", url: "https://www.gfdrr.org/sites/default/files/publication/pda-2005-srilanka.pdf" },
  { key: "Brookings2015", topic: "policy", text: "Brookings Institution (2015). Planned relocations in the context of natural disasters: the case of Sri Lanka. Case study, June 2015.", url: "https://www.brookings.edu/articles/planned-relocations-in-the-context-of-natural-disasters-the-case-of-sri-lanka/" },
  { key: "DMAct2005", topic: "policy", text: "Government of Sri Lanka (2005). Sri Lanka Disaster Management Act, No. 13 of 2005." },
  { key: "Sendai2015", topic: "policy", text: "United Nations (2015). Sendai Framework for Disaster Risk Reduction 2015–2030. UNDRR, Geneva." },
  { key: "ITIC", topic: "policy", text: "NOAA / International Tsunami Information Center. TsuCAT v4.4: PTWC threat-forecast categories of 0.3–1 m, 1–3 m and > 3 m above tide level." },
  { key: "Amante2009", topic: "data", text: "Amante, C. & Eakins, B. W. (2009). ETOPO1 1 Arc-Minute Global Relief Model: Procedures, Data Sources and Analysis. NOAA Technical Memorandum NESDIS NGDC-24.", doi: "10.7289/V5C8276M" },
];

export const TOPICS: Record<Ref["topic"], string> = {
  event: "The 2026 event",
  source: "Earthquake source",
  numerics: "Numerical modelling",
  empirical: "Empirical relations",
  validation: "2004 tsunami: observations and validation",
  hazard: "Hazard assessment",
  impact: "Impact and vulnerability",
  policy: "Warning, policy and practice",
  data: "Data",
};
