import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@frankie-fit/dashboard-core",
    "@frankie-fit/profile-core",
    "@frankie-fit/workout-core"
  ]
};

export default nextConfig;
