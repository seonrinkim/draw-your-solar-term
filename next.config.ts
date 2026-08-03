import type { NextConfig } from "next";

// GitHub Pages serves this as a project site at
// https://seonrinkim.github.io/draw-your-solar-term/ — static export with a
// matching basePath/assetPrefix so built asset URLs resolve under that
// subpath. Only applied for the GitHub Pages build so local `next dev`
// still runs at the site root.
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPagesBuild ? "/draw-your-solar-term" : "";

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
