import type { MetadataRoute } from "next";
/** "Dodaj do ekranu głównego" na telefonie: nazwa, kolory, ikony (bez service workera) */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Płaskie jest nudne: biegi górskie i trailowe w Polsce",
    short_name: "Płaskie jest nudne",
    description: "Kalendarz biegów górskich, trailowych i przełajowych w Polsce dla początkujących.",
    lang: "pl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4efe4",
    theme_color: "#2f5d3a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
