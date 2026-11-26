import { AnalysisView, analysisMetadata } from "@/views/AnalysisView";

export const metadata = analysisMetadata("en");

export default function Page() {
  return <AnalysisView locale="en" />;
}
