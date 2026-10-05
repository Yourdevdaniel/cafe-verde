import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Em Docker o backend é o serviço "backend"; fora dele, localhost.
const alvo = process.env.BACKEND_URL || "http://backend:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // no Windows + Docker os eventos de arquivo não chegam no container;
    // polling garante que o hot reload funcione
    watch: { usePolling: true, interval: 400 },
    proxy: {
      "/api": { target: alvo, changeOrigin: true },
      "/ws": { target: alvo, ws: true, changeOrigin: true },
    },
  },
});
