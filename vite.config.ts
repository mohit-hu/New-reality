// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'components': path.resolve(__dirname, './components'),
      'services': path.resolve(__dirname, './services'),
    },
  },
  build: {
    target: 'esnext',  // Modern ES syntax ke liye
  },
  server: {
    port: 3000,  // Default port set karein agar conflict ho
  },
});
