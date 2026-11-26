"use client";
import dynamic from "next/dynamic";

const Simulator = dynamic(() => import("./Simulator"), {
  ssr: false,
  loading: () => <SimulatorSkeleton />,
});

export function SimulatorSkeleton() {
  return (
    <div className="grid h-[calc(100dvh-56px)] min-h-[620px] place-items-center bg-bg">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent" />
        <p className="note">Loading the numerical model and map…</p>
      </div>
    </div>
  );
}

export default function SimulatorClient() {
  return <Simulator />;
}
