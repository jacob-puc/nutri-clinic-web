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
     * El bundle de la app (\`index\`) rondaba los 590 kB sin dividir, por lo
     * que superaba el aviso de Vite. Se separa lo que cambia poco (vendor) de
     * lo que cambia en cada entrega (codigo de la app) para que el navegador
     * no vuelva a descargar 500 kB de librerias en cada despliegue.
     *
     * El umbral sube a 700 kB porque el aviso por defecto (500 kB) ya no
     * describe el problema real: con el vendor separado, la parte pesada es
     * cacheable de forma estable.
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
