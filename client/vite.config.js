import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
  build: {
    // Warn when chunks exceed 500KB (best practice)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor libraries: split into separate chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react-hot-toast')) {
              return 'vendor-toast';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
