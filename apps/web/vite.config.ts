import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL ?? "http://localhost:8000",
        changeOrigin: true,
      },
      "/ws": {
        target: (process.env.VITE_API_URL ?? "http://localhost:8000").replace(/^http/, "ws"),
        ws: true,
        changeOrigin: true,
      },
      "/health": {
        target: process.env.VITE_API_URL ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "intellicredit-multi-agent-credit.onrender.com",
      "localhost",
      "127.0.0.1",
    ],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
