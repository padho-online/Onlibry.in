// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { renameSync } from 'node:fs'
import { resolve } from 'node:path'

function renderXTemplate() {
  return {
    name: 'renderx-template',
    apply: 'build',

    closeBundle() {
      renameSync(
        resolve('dist/index.html'),
        resolve('dist/renderx-template.html')
      )

      console.log(
        '[RenderX] HTML template generated'
      )
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    renderXTemplate()
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },

  optimizeDeps: {
    include: ['pdfjs-dist'],
  },

  worker: {
    format: 'es',
  },
})