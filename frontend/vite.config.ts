/// <reference types="vitest" /> 
/// <reference types="vite/client" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts', // Optional setup file
    css: true, // if you have css imports in components
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: process.env.RUNNING_IN_DOCKER === 'true' 
          ? 'http://backend:8000'  // use container name in Docker
          : 'http://localhost:8001', // use localhost port mapping outside Docker
        changeOrigin: true,
        secure: false,
        ws: true,
        // Add debug logging for proxy
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxy request:', req.method, req.url, '→', proxyReq.method, proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      },
    },
  },
})
