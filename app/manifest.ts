import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Controle de Hábitos",
    short_name: "Hábitos",
    description: "Acompanhe sua rotina. Transforme sua vida.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3efe7",
    theme_color: "#2f6f5e",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
