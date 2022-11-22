import type { App } from 'vue'
export const key = Symbol('')
export function createCRUD (options: any) {
  return {
    install (app: App) {
      app.provide(key, () => {})
    }
  }
}
