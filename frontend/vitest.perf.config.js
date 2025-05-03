import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/performance-setup.js'],
    include: ['**/*.perf.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 60000, // Performance tests might take longer
    reporters: ['default', 'json'],
    outputFile: {
      json: './perf-results/vitest-results.json'
    }
  },
});