/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      canvas: { browser: "./empty-module.js" },
    },
  },
  webpack: (config) => {
    // Handle canvas module for pdfjs-dist (not available in browser)
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
