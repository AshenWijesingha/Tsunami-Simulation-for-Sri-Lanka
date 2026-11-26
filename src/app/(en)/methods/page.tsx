import { MethodsView, methodsMetadata } from "@/views/MethodsView";

export const metadata = methodsMetadata("en");

export default function Page() {
  return <MethodsView locale="en" />;
}
