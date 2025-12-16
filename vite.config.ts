import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Optimize memory usage during build and runtime
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            // Split code into smaller chunks to reduce memory pressure
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'firebase-vendor': ['firebase/app', 'firebase/database', 'firebase/auth'],
            }
          }
        },
        // Use esbuild for faster minification with lower memory usage
        minify: 'esbuild',
      },
      // Optimize dependencies to reduce bundle size
      optimizeDeps: {
        include: ['react', 'react-dom', 'firebase/app', 'firebase/database', 'firebase/auth'],
      },
    };
});
