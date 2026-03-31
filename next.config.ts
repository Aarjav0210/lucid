import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include the Diamond binary and curated database in serverless bundles
  outputFileTracingIncludes: {
    "/api/screen": ["./bin/diamond", "./data/diamond/curated_toxins.dmnd"],
  },
};

export default nextConfig;
