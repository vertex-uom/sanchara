import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the production image (frontend/Dockerfile.prod).
  output: "standalone",
  experimental: {
    agentFeedback: true,
    // Property logos are up to 2MB; multipart adds a little on top.
    serverActions: {
      bodySizeLimit: "3mb",
    },
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
