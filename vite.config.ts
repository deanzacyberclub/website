import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large third-party libraries into their own chunks
          'framer-motion': ['framer-motion'],
          'supabase': ['@supabase/supabase-js'],
          'ogl': ['ogl'],
          // React-related can sometimes benefit from separate chunking too
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Enable minification and compression hints
    minify: 'esbuild',
    cssCodeSplit: true,
  },
})
