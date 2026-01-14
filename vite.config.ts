import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { VitePWA } from "vite-plugin-pwa";

const config = defineConfig({
  plugins: [
    devtools(),
    nitro({ preset: process.env.VERCEL ? "vercel" : "bun" }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "script",
      includeAssets: ["favicon.png", "logo192.png", "logo512.png"],
      manifest: {
        name: "Param Img",
        short_name: "Param Img",
        description: "Resize images for Instagram Stories",
        theme_color: "#808080",
        background_color: "#808080",
        display: "standalone",
        icons: [
          {
            src: "logo192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globDirectory: ".output/public",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        cleanupOutdatedCaches: true,
        navigateFallback: null,
      },
    }),
  ],
});

export default config;
