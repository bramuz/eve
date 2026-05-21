import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Generar hashes únicos para cada build
    rollupOptions: {
      output: {
        // Agregar hash a los nombres de archivos para cache busting
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    },
    // Generar manifest para tracking de versiones
    manifest: true,
    // Limpiar el directorio dist antes de cada build
    emptyOutDir: true
  }
})
