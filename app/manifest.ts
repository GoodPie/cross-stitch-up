import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cross Stitch-up",
    short_name: "Cross Stitch-up",
    description: "Tools for cross-stitching",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#B8492E",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
