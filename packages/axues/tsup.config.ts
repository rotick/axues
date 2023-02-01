import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  external: ['vue', 'axios'],
  format: ['cjs', 'esm', 'iife'],
  splitting: false,
  sourcemap: true,
  clean: true
})
