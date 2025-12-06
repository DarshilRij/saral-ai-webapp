// vite.config.ts
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        // forward all requests starting with /api to target
        "/api": {
          target: "https://saral-ai-api.headsin.co/api/v1", // <-- target includes the remote base path
          changeOrigin: true,
          secure: true, // set to false only if remote has self-signed cert
          rewrite: (path) => path.replace(/^\/api/, ""), // '/api/auth/send-otp' => '/auth/send-otp' appended to target
        },
        // Example: proxy a second endpoint
        "/proxy-gemini": {
          target: "https://gemini.example.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/proxy-gemini/, ""),
        },
      },
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.VITE_API_BASE": JSON.stringify(env.VITE_API_BASE),
      "process.env.API_BASE": JSON.stringify(env.API_BASE),
      "process.env.MODE": JSON.stringify(env.MODE),
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, ".") },
    },
  };
});
