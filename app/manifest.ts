import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "540A Cleaning",
    short_name: "540A",
    description: "Shared house tasks for 540A.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#020617",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
