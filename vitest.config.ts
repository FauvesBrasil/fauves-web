import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFilesAfterEnv: ['./src/setupTests.ts'],
    environment: 'jsdom',
  },
});