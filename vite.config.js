import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so the built site works from any path, including the
  // GitHub Pages project subpath (https://<user>.github.io/HomeVault/).
  base: './',
  plugins: [react()],
  server: { host: true },
})
