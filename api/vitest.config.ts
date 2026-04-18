import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    root: './',
    reporters: ['tree']
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' }
    })
  ],
  resolve: {
    alias: {
      '@test': './test',
      '@modules': './src/modules',
      '@shared': './src/shared'
    }
  }
})
