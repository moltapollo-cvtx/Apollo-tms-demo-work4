import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
          Access Denied
        </h1>
        <p className="mt-4 text-base text-zinc-600">
          You don&apos;t have permission to access this page. Contact your administrator if you believe this is an error.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-apollo-cyan-500 px-6 text-sm font-medium text-white transition-colors hover:bg-apollo-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apollo-cyan-500 focus-visible:ring-offset-2"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
