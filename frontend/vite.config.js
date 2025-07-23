import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync('./ssl/key.pem'),
      cert: fs.readFileSync('./ssl/cert.pem')
    },
    proxy: {
      '/text': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/text/, '/text')
      }
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '813a9b6ce93a.ngrok-free.app'
    ]
  },
  build:{
    outDir: 'dist-react'
  }
})