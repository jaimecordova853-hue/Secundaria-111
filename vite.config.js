import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Esta configuración es vital para que Vercel entienda tu App
export default defineConfig({
  plugins: [react()],
})
