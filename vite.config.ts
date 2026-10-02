/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/google-oauth': {
        target: 'https://oauth2.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-oauth/, '')
      },
      '/api/google-sheets': {
        target: 'https://sheets.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-sheets/, '')
      },
      '/api/google-drive': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-drive/, '')
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.kilo/**'],
  },
});
