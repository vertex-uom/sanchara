"use client";

import { useSyncExternalStore } from "react";
import type { WebsiteAnalytics } from "../server/website-analytics";
import { DRAFT_KEYS, useSavedDraft } from "./template-draft";
import { WebsiteBuilderStart } from "./website-builder-start";
import { WebsiteDashboard } from "./website-dashboard";

type WebsiteHomeProps = {
  analytics: WebsiteAnalytics;
  hotelName: string;
  city: string;
  country: string;
};

const noSubscription = () => () => {};

// Website Builder landing: the start screen until the site is published,
// then the website dashboard. The publish state lives in this browser, so
// nothing is chosen until it can be read.
export function WebsiteHome(props: WebsiteHomeProps) {
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const publish = useSavedDraft<{ publishedAt: string | null }>(
    DRAFT_KEYS.publish,
  );

  if (!hydrated) {
    return <span className="sr-only">Loading website builder</span>;
  }
  return publish?.publishedAt ? (
    <WebsiteDashboard {...props} />
  ) : (
    <WebsiteBuilderStart />
  );
}
