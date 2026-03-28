import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Pecah bundle jadi chunk-chunk kecil → browser cache lebih efisien
    rollupOptions: {
      output: {
        manualChunks: {
          // Library besar dipisah supaya tidak ikut rebuild tiap deploy
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-mqtt':   ['mqtt'],
          'vendor-axios':  ['axios'],
        },
      },
    },
    // Peringatkan jika ada chunk > 500kb
    chunkSizeWarningLimit: 500,
  },
})