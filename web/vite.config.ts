//import netlify from '@netlify/vite-plugin-tanstack-start'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    // Puerto fijo para no chocar con otros proyectos (5173 lo usa otro) y
    // mantener el origen alineado con TRUSTED_ORIGINS del API.
    port: 5174,
    strictPort: true
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    // netlify(),
    viteReact()
  ]
})

export default config
