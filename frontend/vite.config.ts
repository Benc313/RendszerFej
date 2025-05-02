import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all requests starting with /api to the backend server
      '/api': {
        target: 'http://localhost:5196', // Your backend address
        changeOrigin: true,
        secure: false,      // If backend is not HTTPS
        // No rewrite needed if backend routes also start with /api
        // rewrite: (path) => path.replace(/^\/api/, '') // Remove this if backend routes are now /api/...
      }
    },
    port: 5173, // Keep your frontend port
  }
})
