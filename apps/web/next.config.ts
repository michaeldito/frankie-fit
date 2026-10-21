import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@frankie-fit/brand-core",
    "@frankie-fit/companion-core",
    "@frankie-fit/dashboard-core",
    "@frankie-fit/profile-core",
    "@frankie-fit/workout-core"
  ]
};

export default nextConfig;
