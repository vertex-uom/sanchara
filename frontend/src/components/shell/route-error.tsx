"use client";

// Shared fallback for each app's error.tsx.
export function RouteError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main role="alert" className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <button type="button" onClick={() => retry()} className="mt-4 min-h-11 rounded-md border px-4">
        Try again
      </button>
    </main>
  );
}
