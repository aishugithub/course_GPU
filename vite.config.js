import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ Change ONLY this line per course — must match your GitHub repo name
export default defineConfig({
  plugins: [react()],
  base: '/course_GPU/',
})
