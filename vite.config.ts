import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { leadsCsvPlugin } from './vite-plugin-leads.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), leadsCsvPlugin()],
})
