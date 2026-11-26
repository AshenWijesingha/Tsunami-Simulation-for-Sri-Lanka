"use client";
import dynamic from "next/dynamic";
import { LogoMark } from "@/components/brand/Logo";
import { useT } from "@/i18n/client";

const Simulator = dynamic(() => import("./Simulator"), {
  ssr: false,
  loading: () => <SimulatorSkeleton />,
});

/** Loading state. Also the content crawlers see before JavaScript runs, so it describes the tool. */
export function SimulatorSkeleton() {
  const t = useT();
  return (
    <div className="hero-bg grid h-[calc(100dvh-64px)] min-h-[620px] place-items-center px-4">
      <div className="max-w-xl text-center">
        <div className="relative mx-auto h-16 w-16">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-accent/20 motion-reduce:animate-none" />
          <LogoMark size={64} className="relative" />
        </div>
        <p className="mt-5 font-semibold text-fg">{t.common.loadingSim}</p>
        <p className="note mx-auto mt-3 max-w-md">{t.common.simAbout}</p>
      </div>
    </div>
  );
}

export default function SimulatorClient() {
  return <Simulator />;
}
