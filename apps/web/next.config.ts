import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the dev-only Next badge off the sidebar's Frankie dock (bottom-left).
  devIndicators: { position: "bottom-right" },
  transpilePackages: [
    "@frankie-fit/brand-core",
    "@frankie-fit/companion-core",
    "@frankie-fit/dashboard-core",
    "@frankie-fit/profile-core",
    "@frankie-fit/workout-core"
  ]
};

export default nextConfig;
