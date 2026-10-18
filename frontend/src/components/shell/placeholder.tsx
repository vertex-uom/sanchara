// Temporary stand-in for routes that have no feature UI yet.
export function Placeholder({ title, notes }: { title: string; notes?: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {notes ? <p className="mt-2 text-sm opacity-70">{notes}</p> : null}
    </main>
  );
}
