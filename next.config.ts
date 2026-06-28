import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root — sibling lockfiles elsewhere on disk otherwise
  // confuse Next's auto-detection.
  outputFileTracingRoot: path.join(__dirname),
  // Keep builds resilient during early development; tighten before production.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
