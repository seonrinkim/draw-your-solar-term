import type { NextConfig } from "next";

// Custom domain (vanhetseizoen.nl, see public/CNAME) serves this at the
// domain root, so no basePath/assetPrefix subpath is needed for the
// GitHub Pages build anymore.
const basePath = "";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "export",
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
