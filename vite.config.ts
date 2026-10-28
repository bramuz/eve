import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Generar hashes únicos para cada build
    rolldownOptions: {
      output: {
        // Agregar hash a los nombres de archivos para cache busting
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
        // Separar librerías en chunks propios: no cambian entre deploys,
        // así el navegador las reutiliza desde caché y solo descarga el código de la app
        codeSplitting: {
          groups: [
            { name: 'vendor-firebase', test: /node_modules[\\/](firebase|@firebase)[\\/]/ },
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            { name: 'vendor-motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ }
          ]
        }
      }
    },
    // Generar manifest para tracking de versiones
    manifest: true,
    // Limpiar el directorio dist antes de cada build
    emptyOutDir: true
  }
})
