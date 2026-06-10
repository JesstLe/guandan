import { defineConfig as defineVitestConfig, defineProject, mergeConfig } from 'vitest/config';
import { defineConfig as defineViteConfig } from 'vite';
import path from 'path';

const baseConfig = defineViteConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@guandan/shared': path.resolve(__dirname, './shared/src'),
    },
  },
});

export default defineViteConfig({
  // @ts-expect-error - projects is valid in vitest but not in vite types
  projects: [
    defineProject(
      mergeConfig(baseConfig, defineVitestConfig({
        test: {
          name: 'shared',
          environment: 'node',
          include: ['shared/src/**/*.test.ts', 'shared/src/**/*.spec.ts'],
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './shared/src'),
          },
        },
      }))
    ),
    defineProject(
      mergeConfig(baseConfig, defineVitestConfig({
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/src/**/*.test.ts', 'server/src/**/*.spec.ts'],
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './server/src'),
          },
        },
      }))
    ),
    defineProject(
      mergeConfig(baseConfig, defineVitestConfig({
        test: {
          name: 'client',
          environment: 'jsdom',
          setupFiles: ['./client/vitest.setup.ts'],
          include: ['client/src/**/*.test.ts', 'client/src/**/*.test.tsx', 'client/src/**/*.spec.ts', 'client/src/**/*.spec.tsx'],
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './client/src'),
          },
        },
      }))
    ),
  ],
});
