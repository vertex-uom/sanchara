export type BookingEngineStatus = "live" | "offline";

// Company website status as returned by the API.
export type WebsiteStatus = {
  subdomain: string; // host = {subdomain}.PLATFORM_DOMAIN
  published: boolean;
  bookingEngine: BookingEngineStatus;
};
