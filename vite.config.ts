import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { csvApiPlugin } from './vite-plugin-csv-api.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), csvApiPlugin()],
})
