import { ImpactView, impactMetadata } from "@/views/ImpactView";

export const metadata = impactMetadata("en");

export default function Page() {
  return <ImpactView locale="en" />;
}
