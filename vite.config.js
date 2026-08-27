import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    watch: {
      // Windows potrafi zablokować duże PNG dla natywnego FSWatcher (EBUSY).
      // Polling nie zakłada uchwytu obserwatora na plikach, a statyczne banery
      // są dodatkowo pomijane przez funkcję odporną na separatory Windows.
      usePolling: process.platform === 'win32',
      interval: 500,
      ignored: (watchedPath) => watchedPath
        .replaceAll('\\', '/')
        .includes('/public/banery_zakony/')
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
});
