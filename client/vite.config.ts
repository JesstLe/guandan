import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3666,
    proxy: {
      '/api': 'http://localhost:3667',
      '/ws': {
        target: 'ws://localhost:3667',
        ws: true,
      },
    },
  },
})
