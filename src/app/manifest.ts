import { MERK } from "@/lib/merk";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: MERK,
    short_name: MERK,
    description: "AI-boekhouding voor zzp'ers. Bank, bonnen, facturen en btw, automatisch.",
    start_url: "/app",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#1c1917",
    lang: "nl",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
