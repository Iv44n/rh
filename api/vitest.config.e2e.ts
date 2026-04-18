import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './'
  },
  resolve: {
    alias: {
      '@test': './test',
      '@modules': './src/modules',
      '@shared': './src/shared'
    }
  },
  plugins: [swc.vite()]
})
