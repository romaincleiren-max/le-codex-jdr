import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Force un nouveau hash pour chaque build
    rollupOptions: {
      output: {
        // Change le pattern de nommage pour forcer un nouveau hash
        entryFileNames: `assets/[name]-[hash]-v2.js`,
        chunkFileNames: `assets/[name]-[hash]-v2.js`,
        assetFileNames: `assets/[name]-[hash]-v2.[ext]`
      }
    },
    // Désactiver le cache
    emptyOutDir: true
  }
})
