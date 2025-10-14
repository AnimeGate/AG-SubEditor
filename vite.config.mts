import * as path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom plugin to copy debug console HTML
function copyDebugConsole() {
  return {
    name: "copy-debug-console",
    closeBundle() {
      const src = path.join(__dirname, "src/debug-console.html");
      const dest = path.join(__dirname, "dist-electron/debug-console.html");
      fs.copyFileSync(src, dest);
    },
  };
}

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
        input: {
          preload: "src/preload.ts",
          "debug-console-preload": "src/debug-console-preload.ts",
        },
        vite: {
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "./src"),
            },
          },
          build: {
            rollupOptions: {
              external: ["electron"],
              output: {
                inlineDynamicImports: false,
              },
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
    copyDebugConsole(),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
