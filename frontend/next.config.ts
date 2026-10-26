import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Keep Turbopack's dev cache in memory. On disk it grows by hundreds of MB
    // per day of editing (.next/dev/cache/turbopack) and is never pruned; the
    // cost is a full compile after a dev-server restart, not on hot reload.
    turbopackFileSystemCacheForDev: false,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
