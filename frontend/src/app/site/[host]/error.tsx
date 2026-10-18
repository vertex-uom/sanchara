"use client";

import { RouteError } from "@/components/shell/route-error";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <RouteError error={error} retry={retry} />;
}
