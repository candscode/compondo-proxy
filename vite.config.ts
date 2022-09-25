import path from 'path'

import vuePlugin from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const config = defineConfig({
  root: path.join(__dirname, 'src', 'renderer'),
  publicDir: 'public',
  server: {
    port: 8080
  },
  build: {
    outDir: path.join(__dirname, 'build', 'renderer'),
    emptyOutDir: true
  },
  plugins: [vuePlugin()]
})

export default config
