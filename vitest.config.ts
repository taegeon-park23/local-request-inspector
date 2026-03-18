import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@client': path.resolve(__dirname, 'client'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./client/shared/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
    },
  },
});
