import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GreenSori Map",
    short_name: "GreenSori",
    description: "그린소리가 담은 카페 · 공간 · 여행의 기록",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f2ea",
    theme_color: "#6f4e37",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
