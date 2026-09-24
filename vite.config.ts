import path from "node:path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  // Lets `vite preview` be reached through a temporary share tunnel (e.g. trycloudflare.com).
  preview: { allowedHosts: ['.trycloudflare.com'] },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
})
