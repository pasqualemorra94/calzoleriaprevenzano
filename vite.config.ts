import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import path from "node:path";

export default defineConfig({
  server: {
    port: 3000,
  },
  define: {
    "import.meta.env.VITE_GA4_MEASUREMENT_ID": JSON.stringify(
      process.env.VITE_GA4_MEASUREMENT_ID ?? "",
    ),
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
    nitro(),
  ],
});
