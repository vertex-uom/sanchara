import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RoomsDevVariantView, type RoomsDevVariant } from "@/features/rooms";

const VARIANTS: readonly RoomsDevVariant[] = ["readonly", "loading", "error"];

type DevProps = Pick<PageProps<"/backoffice/rooms-test">, "searchParams">;

// THROWAWAY dev page for Rooms & Units. ?variant=readonly|loading|error shows
// the page in that state. Delete once the real page is done. Not served in
// production.
export default function Page({ searchParams }: PageProps<"/backoffice/rooms-test">) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <Variant searchParams={searchParams} />
    </Suspense>
  );
}

async function Variant({ searchParams }: DevProps) {
  const { variant } = await searchParams;
  const match = VARIANTS.find((v) => v === variant);
  if (match) return <RoomsDevVariantView variant={match} />;

  return (
    <main className="space-y-3 p-6 text-sm">
      <h1 className="font-semibold">Rooms & Units dev variants</h1>
      <ul className="list-disc pl-5">
        {VARIANTS.map((v) => (
          <li key={v}>
            <Link className="underline" href={`/rooms-test?variant=${v}`}>
              {v}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
