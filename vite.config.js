import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        // Bibliothèques dans des fichiers séparés : elles changent rarement, donc restent en
        // cache navigateur d'une mise en ligne à l'autre (seul le code du site est retéléchargé).
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          motion: ['motion/react']
        }
      }
    }
  },
  server: {
    // Configuration pour le routage SPA en développement
    historyApiFallback: true,
  },
})
