import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// ES module compatibility fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: "client",
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  server: {
    port: 5000, // CHANGED FROM 3000
    host: "0.0.0.0",
    hmr: {
      port: 5001, // ADDED EXPLICIT HMR PORT
      host: "localhost",
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000", // CHANGED FROM 3001
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:5000", // CHANGED FROM 3001
        ws: true,
      },
    },
  },
});
