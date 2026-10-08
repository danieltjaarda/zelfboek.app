import { MERK } from "@/lib/merk";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: MERK,
    short_name: MERK,
    description: "AI-boekhouding voor zzp'ers. Bank, bonnen, facturen en btw, automatisch.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f6f8fa",
    theme_color: "#ffffff",
    lang: "nl",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
