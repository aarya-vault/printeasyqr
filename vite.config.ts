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
    port: 5000,
    host: "0.0.0.0",
    hmr: {
      port: 5001,
      host: "localhost",
      clientPort: 5001, // This is the key fix!
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:5000",
        ws: true,
      },
    },
  },
  // Add environment variables to prevent 0.0.0.0 connection issues
  define: {
    __VITE_HMR_HOST__: JSON.stringify("localhost"),
    __VITE_HMR_PORT__: 5001,
  },
});
