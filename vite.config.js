import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { esbuildVersion } from 'vite'

export default defineConfig({
  base: './',
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  worker: {
    format: "es",
    plugins: [
      wasm(),
      topLevelAwait()
    ]
  }
})
