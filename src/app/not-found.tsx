import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="eyebrow text-accent">404</div>
      <h1 className="mt-2 text-3xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-fg-2">That page drifted out of the model domain.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to overview
      </Link>
    </div>
  );
}
