import { ExercisesView, exercisesMetadata } from "@/views/ExercisesView";

export const metadata = exercisesMetadata("en");

export default function Page() {
  return <ExercisesView locale="en" />;
}
