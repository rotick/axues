import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  minify: true,
  external: ['vue', 'axios'],
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  clean: true
})
