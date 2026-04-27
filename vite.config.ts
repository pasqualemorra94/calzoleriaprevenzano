import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import path from "node:path";

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, "public", "uploads");

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "motion/react": "framer-motion",
      motion: "framer-motion",
      zod: path.resolve(__dirname, "node_modules/zod"),
    },
    conditions: ["browser", "development", "node"],
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src",
    }),
    viteReact(),
    nitro({
      publicAssets: [
        {
          dir: uploadDir,
          baseURL: "/uploads",
          maxAge: 60 * 60 * 24 * 365,
        },
      ],
    }),
  ],
});
