import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { fileURLToPath } from 'node:url'

const zodPath = fileURLToPath(new URL('./node_modules/zod/index.js', import.meta.url))

export default defineConfig({
  server: {
    port: 8090,
    strictPort: true,
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      zod: zodPath,
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
    nitro(),
  ],
})
