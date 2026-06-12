import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Base path para o GitHub Pages (https://<usuario>.github.io/bolao-copa/)
  base: command === 'build' ? '/bolao-copa/' : '/',
}))
