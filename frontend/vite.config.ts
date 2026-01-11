import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5174,
  },
  // Tell Vite to look for .env files in the parent directory (project root)
  envDir: path.resolve(__dirname, ".."),
  // Load VITE_ prefixed env vars from parent directory .env file
  envPrefix: "VITE_",
});

