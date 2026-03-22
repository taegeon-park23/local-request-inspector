import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  root: 'client',
  base: command === 'build' ? '/app/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@client': path.resolve(__dirname, 'client'),
    },
  },
  server: {
    port: 6173,
    proxy: {
      '/api': 'http://localhost:5671',
      '/events': 'http://localhost:5671',
    },
  },
}));
