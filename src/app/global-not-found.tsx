import type { Metadata } from "next";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/noto-sans-sinhala/wght.css";
import "@fontsource-variable/noto-sans-tamil/wght.css";
import "./globals.css";
import { LogoMark } from "@/components/brand/Logo";
import { THEME_SCRIPT } from "@/components/site/ThemeToggle";

export const metadata: Metadata = { title: "404 · Tsunami Lab", robots: { index: false, follow: true } };

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const LANGS = [
  { lang: "en", t: "Page not found", d: "The link may be old or mistyped.", home: "Go to the home page", href: "/" },
  { lang: "si", t: "පිටුව හමු නොවීය", d: "සබැඳිය පැරණි හෝ වැරදියට ටයිප් කළ එකක් විය හැක.", home: "මුල් පිටුවට යන්න", href: "/si/" },
  { lang: "ta", t: "பக்கம் கிடைக்கவில்லை", d: "இணைப்பு பழையதாக அல்லது தவறாகத் தட்டச்சு செய்யப்பட்டதாக இருக்கலாம்.", home: "முகப்புப் பக்கத்துக்குச் செல்லவும்", href: "/ta/" },
];

/** Global 404 for URLs that match no route. The language is unknown, so it speaks all three. */
export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="hero-bg grid min-h-dvh place-items-center px-4">
        <main className="w-full max-w-xl py-16 text-center">
          <LogoMark size={56} className="mx-auto" />
          <div className="eyebrow mt-6 !text-accent">Error 404</div>
          <ul className="mt-6 grid gap-4">
            {LANGS.map((l) => (
              <li key={l.lang} lang={l.lang} className="card p-5">
                <h1 className="text-2xl font-bold text-fg">{l.t}</h1>
                <p className="mt-1 text-fg-2">{l.d}</p>
                <a href={`${BASE}${l.href}`} className="btn btn-primary mt-4">
                  {l.home}
                </a>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  );
}
