import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: https://<user>.github.io/nurse-exam-practice/
export default defineConfig({
  plugins: [react()],
  base: '/nurse-exam-practice/',
})
