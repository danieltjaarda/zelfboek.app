import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ontwikkelknop rechtsonder, zodat hij niet over de zijbalk valt.
  devIndicators: { position: "bottom-right" },
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
