import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' lets the built game be hosted from any sub-path (GitHub Pages, Replit, etc.)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
