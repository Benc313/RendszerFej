import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // Hozzáadva a server konfiguráció
    proxy: {
      // Az /api kezdetű kéréseket átirányítja a backendhez
      '/api': {
        target: 'https://localhost:7001', // Cseréld le a backend tényleges címére és portjára, ha szükséges
        changeOrigin: true,
        secure: false, // Szükséges lehet, ha a backend self-signed certifikátot használ fejlesztéskor
        rewrite: (path) => path.replace(/^\/api/, ''), // Eltávolítja az /api prefixet a backend felé menő kérésből
      },
    },
  },
})
