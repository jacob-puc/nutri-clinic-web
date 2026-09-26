import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    /**
     * El bundle sin dividir pasaba los 590 kB y Vite avisaba. Con el vendor
     * separado en chunks cacheables, la parte pesada deja de cambiar en cada
     * entrega, asi que 700 kB ya no describe un problema real.
     */
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: "router", test: /node_modules[\\/](react-router|react-router-dom)[\\/]/ },
            { name: "data", test: /node_modules[\\/](@tanstack|axios)[\\/]/ },
            { name: "ui", test: /node_modules[\\/](radix-ui|@radix-ui|class-variance-authority|clsx|tailwind-merge|sonner)[\\/]/ },
            { name: "icons", test: /node_modules[\\/lucide-react[\\/]/ },
          ],
        },
      },
    },
  },
});
