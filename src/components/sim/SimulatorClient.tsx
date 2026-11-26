"use client";
import dynamic from "next/dynamic";
import { LogoMark } from "@/components/brand/Logo";

const Simulator = dynamic(() => import("./Simulator"), {
  ssr: false,
  loading: () => <SimulatorSkeleton />,
});

/** Loading state. Also the content crawlers see before JavaScript runs, so it describes the tool. */
export function SimulatorSkeleton() {
  return (
    <div className="hero-bg grid h-[calc(100dvh-64px)] min-h-[620px] place-items-center px-4">
      <div className="max-w-xl text-center">
        <div className="relative mx-auto h-16 w-16">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-accent/20 motion-reduce:animate-none" />
          <LogoMark size={64} className="relative" />
        </div>
        <p className="mt-5 font-semibold text-fg">Loading the numerical model and map…</p>
        <p className="note mx-auto mt-3 max-w-md">
          A linear shallow-water tsunami model of the Indian Ocean (50–100° E, 30° S – 25° N) that runs in your browser. Simulate the 24 November 2026 M6.5
          Central Indian Ridge earthquake, define a hypothetical source, or validate against the 2004 Sumatra–Andaman tsunami, with synthetic tide gauges
          for 21 Sri Lankan coastal stations. Requires JavaScript and WebGL.
        </p>
      </div>
    </div>
  );
}

export default function SimulatorClient() {
  return <Simulator />;
}
