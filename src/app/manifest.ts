import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LEENA CEYLON - Pure Ceylon Tea",
    short_name: "LEENA",
    description:
      "Official website of LEENA CEYLON. Handpicked 100% pure authentic Sri Lankan Ceylon Tea directly from misty mountain estates.",
    start_url: "/",
    display: "standalone",
    background_color: "#0E2419",
    theme_color: "#1B4332",
    icons: [
      {
        src: "/brand/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
