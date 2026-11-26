import { LearnView, learnMetadata } from "@/views/LearnView";

export const metadata = learnMetadata("en");

export default function Page() {
  return <LearnView locale="en" />;
}
