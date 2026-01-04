import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  
  build: {
    // Generate source maps for production debugging (can be disabled for smaller bundle)
    sourcemap: false,
    
    // Optimize bundle size (using esbuild, faster than terser)
    minify: 'esbuild',
    
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'framer-motion': ['framer-motion'],
          'xlsx': ['xlsx'],
          'date-fns': ['date-fns'],
        },
      },
    },
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Asset inline limit (smaller assets will be inlined as base64)
    assetsInlineLimit: 4096,
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: false,
    open: true,
  },
  
  // Development server configuration
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
})

