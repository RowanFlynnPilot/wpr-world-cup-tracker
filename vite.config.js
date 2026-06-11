import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// base must match the GitHub repo name for Pages.
// Two entry points: the full tracker (index.html) and the sidebar-size
// mini (mini.html) — both deploy from the same build.
export default defineConfig({
  plugins: [react()],
  base: '/wpr-world-cup-tracker/',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        mini: fileURLToPath(new URL('./mini.html', import.meta.url)),
      },
    },
  },
})
