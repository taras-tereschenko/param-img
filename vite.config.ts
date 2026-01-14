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
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "prompt",
      injectRegister: "script",
      includeAssets: ["favicon.png", "logo192.png", "logo512.png"],
      manifest: {
        name: "Param Img",
        short_name: "Param Img",
        description: "Resize images for Instagram Stories",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        start_url: "/",
        scope: "/",
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
        share_target: {
          action: "/_share",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            files: [
              {
                name: "images",
                accept: ["image/*"],
              },
            ],
          },
        },
      },
      injectManifest: {
        globDirectory: process.env.VERCEL
          ? ".vercel/output/static"
          : ".output/public",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
      },
    }),
  ],
});

export default config;
