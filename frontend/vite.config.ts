import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Az '/api' kezdetű kérések átirányítása a backendhez (UserController)
      '/api': {
        target: 'http://localhost:5196', // A backend címe
        changeOrigin: true,
        secure: false, // Fejlesztéshez, ha a backend HTTPS-t használna önaláírt tanúsítvánnyal
      },
      // Külön proxy szabályok a gyökérben lévő végpontokhoz
      '/register': {
         target: 'http://localhost:5196',
         changeOrigin: true,
         secure: false,
      },
      '/login': {
         target: 'http://localhost:5196',
         changeOrigin: true,
         secure: false,
      },
      '/logout': {
         target: 'http://localhost:5196',
         changeOrigin: true,
         secure: false,
      },
       '/movies': {
         target: 'http://localhost:5196',
         changeOrigin: true,
         secure: false,
      },
       '/screenings': {
         target: 'http://localhost:5196',
         changeOrigin: true,
         secure: false,
      },
       '/orders': {
         target: 'http://localhost:5196',
         changeOrigin: true,
         secure: false,
      },
       '/tickets': {
         target: 'http://localhost:5196',
         changeOrigin: true,
         secure: false,
      },
       '/room': {
         target: 'http://localhost:5196',
         changeOrigin: true,
         secure: false,
      },
       '/admin': {
         target: 'http://localhost:5196',
         changeOrigin: true,
         secure: false,
      }
    }
  }
})
