import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    cors: true,
    // Em desenvolvimento, NÃO injete CSP que quebre HMR
    headers: mode === 'development' ? {} : {
      'Content-Security-Policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; object-src 'none';"
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
}))
