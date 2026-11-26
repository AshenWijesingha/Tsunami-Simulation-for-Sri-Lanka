import Link from "@/i18n/Link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, Languages } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/lib/seo";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n/server";

export interface Crumb {
  name: string;
  path: string;
}

export function Breadcrumbs({ items, locale }: { items: Crumb[]; locale: Locale }) {
  const d = getDict(locale);
  const all = [{ name: d.nav.home, path: "/" }, ...items];
  return (
    <>
      <nav aria-label={d.nav.breadcrumb}>
        <ol className="flex flex-wrap items-center gap-1 text-[0.8rem] text-muted">
          {all.map((c, i) => (
            <li key={c.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={13} aria-hidden className="opacity-60" />}
              {i < all.length - 1 ? (
                <Link href={c.path} className="text-muted no-underline hover:text-accent">
                  {c.name}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-fg-2">
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(locale, all)} />
    </>
  );
}

export function PageHeader({
  eyebrow,
  icon: Icon,
  title,
  lead,
  crumbs,
  locale,
  children,
}: {
  locale: Locale;
  eyebrow?: string;
  icon?: LucideIcon;
  title: ReactNode;
  lead?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
}) {
  return (
    <div className="hero-bg relative overflow-hidden border-b border-line">
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-[1240px] px-4 pb-10 pt-6 md:pb-14">
        {crumbs && <Breadcrumbs items={crumbs} locale={locale} />}
        <div className="mt-8 md:mt-10">
          {eyebrow && (
            <div className="mb-3 inline-flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-accent">
              {Icon && <Icon size={16} aria-hidden />}
              {eyebrow}
            </div>
          )}
          <h1 className="font-display max-w-4xl text-[2.1rem] font-semibold leading-[1.1] tracking-tight text-fg md:text-[3rem]">{title}</h1>
          {lead && <p className="mt-4 max-w-3xl text-lg leading-relaxed text-fg-2">{lead}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

export function Container({ children, className = "", lang }: { children: ReactNode; className?: string; lang?: string }) {
  return (
    <div className={`mx-auto max-w-[1240px] px-4 ${className}`} lang={lang}>
      {children}
    </div>
  );
}

export function Stat({ value, label, sub, icon: Icon }: { value: ReactNode; label: ReactNode; sub?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="card p-4">
      {Icon && <Icon size={18} className="mb-2 text-accent" aria-hidden />}
      <div className="text-[1.55rem] font-extrabold leading-tight tracking-tight tabular-nums text-fg">{value}</div>
      <div className="mt-1 text-sm font-semibold text-fg-2">{label}</div>
      {sub && <div className="note mt-1">{sub}</div>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, lead, id }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; id?: string }) {
  return (
    <div id={id} className="max-w-3xl scroll-mt-24">
      {eyebrow && <div className="eyebrow mb-2 !text-accent">{eyebrow}</div>}
      <h2 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-fg md:text-[2.1rem]">{title}</h2>
      {lead && <p className="mt-3 text-[1.02rem] leading-relaxed text-fg-2">{lead}</p>}
    </div>
  );
}

export function Cite({ children }: { children: ReactNode }) {
  return <span className="text-muted">({children})</span>;
}

/** Shown on Sinhala and Tamil pages whose long-form scientific text is English only. */
export function EnglishOnlyNotice({ locale, className = "" }: { locale: Locale; className?: string }) {
  if (locale === "en") return null;
  const d = getDict(locale);
  return (
    <div className={`callout callout-info flex gap-3 ${className}`} role="note">
      <Languages size={20} className="mt-0.5 flex-none text-accent" aria-hidden />
      <div>
        <b>{d.common.englishOnlyTitle}.</b> {d.common.englishOnlyText}
      </div>
    </div>
  );
}
