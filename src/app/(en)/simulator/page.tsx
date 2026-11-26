import { SimulatorView, simulatorMetadata } from "@/views/SimulatorView";

export const metadata = simulatorMetadata("en");

export default function Page() {
  return <SimulatorView locale="en" />;
}
