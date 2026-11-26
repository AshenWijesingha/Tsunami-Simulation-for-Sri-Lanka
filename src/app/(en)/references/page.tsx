import { ReferencesView, referencesMetadata } from "@/views/ReferencesView";

export const metadata = referencesMetadata("en");

export default function Page() {
  return <ReferencesView locale="en" />;
}
