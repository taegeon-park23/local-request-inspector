import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, 'client');

export default defineConfig({
  resolve: {
    alias: [
      { find: '@client', replacement: clientRoot },
      { find: '@monaco-editor/react', replacement: path.resolve(clientRoot, 'shared/test/mocks/monaco-react.tsx') },
      { find: /^monaco-editor$/, replacement: path.resolve(clientRoot, 'shared/test/mocks/monaco-editor.ts') },
      { find: /^monaco-editor\/esm\/vs\/editor\/editor\.worker\?worker$/, replacement: path.resolve(clientRoot, 'shared/test/mocks/monaco-worker.ts') },
      { find: /^monaco-editor\/esm\/vs\/language\/typescript\/ts\.worker\?worker$/, replacement: path.resolve(clientRoot, 'shared/test/mocks/monaco-worker.ts') },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./client/shared/test/setup.ts'],
    include: ['client/**/*.test.{ts,tsx}', 'client/**/*.spec.{ts,tsx}', 'mock-rule-engine.test.js'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text'],
    },
  },
});
