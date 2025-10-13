import * as path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    electron({
      main: {
        // Main process entry point
        entry: "src/main.ts",
        vite: {
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "./src"),
            },
          },
          build: {
            rollupOptions: {
              external: [
                "electron",
                "electron-devtools-installer",
              ],
            },
          },
        },
      },
      preload: {
        // Preload script entry point
        input: "src/preload.ts",
        vite: {
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "./src"),
            },
          },
          build: {
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
      },
      // Enable this to enable the Node.js API in renderer process
      // renderer: {},
    }),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
