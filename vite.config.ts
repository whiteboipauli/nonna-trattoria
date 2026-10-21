import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Auf GitHub Pages liegt die Seite unter /nonna-trattoria/, lokal unter /.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
})
