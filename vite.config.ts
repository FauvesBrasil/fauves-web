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
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Core vendor libraries (always needed)
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],

            // Admin-only heavy dependencies
            'admin-charts': ['recharts'],
            'admin-editor': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-image'],

            // UI library (Radix components)
            'ui-radix': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-tabs',
              '@radix-ui/react-select',
              '@radix-ui/react-popover',
              '@radix-ui/react-toast',
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-label',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-slider',
              '@radix-ui/react-switch',
            ],

            // Utilities & Heavy libs
            'vendor-utils': [
              'date-fns',
              'framer-motion',
              'lucide-react',
              '@tanstack/react-query',
            ],

            // Form & Validation
            'vendor-forms': [
              'react-hook-form',
              '@hookform/resolvers',
              'zod',
            ],

            // Supabase & API
            'vendor-api': [
              '@supabase/supabase-js',
              'socket.io-client',
            ],
          },
        },
      },
      chunkSizeWarningLimit: 600, // Warn if chunk > 600KB
    },
  };
});
