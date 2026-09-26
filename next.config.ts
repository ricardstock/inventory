import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/inventory",
  trailingSlash: true,
};

export default nextConfig;