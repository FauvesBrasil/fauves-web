import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from 'vite-plugin-svgr';
import path from "path";
// removed lovable-tagger import

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget = env.VITE_BACKEND_URL || `http://localhost:${env.VITE_BACKEND_PORT || "4000"}`;

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/events': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  plugins: [react(), svgr({ svgrOptions: { icon: false } })].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
