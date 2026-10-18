import type { WebsiteStatus } from "../types";

// TEMPORARY fixture. Replace the body with the website API call once the
// API client exists; the return type stays the same.
export async function getWebsiteStatus(): Promise<WebsiteStatus> {
  return { subdomain: "palmbreeze", published: true, bookingEngine: "live" };
}
