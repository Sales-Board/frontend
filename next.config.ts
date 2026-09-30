import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
};

export default nextConfig;
