import { describe, expect, test, vi } from 'vitest'
import { createApp, App } from 'vue'
import axios from 'axios'
import { createAxues, useAxues } from '../src'
// @vitest-environment happy-dom
function createVueApp (app: App) {
  const id = `app-${Date.now()}`
  const dom = document.createElement('div')
  dom.id = id
  document.body.appendChild(dom)
  app.mount(`#${id}`)
}
describe('pending and loading', () => {
  const axiosInstance = axios.create({
    baseURL: 'https://axues.io'
  })
  const axues = createAxues(axiosInstance)
  test('should true when request start', () => {
    const app = createApp({
      setup () {
        vi.useFakeTimers()
        const { pending, loading, action } = useAxues('/delay/2')
        expect(pending.value).toBe(false)
        action()
        expect(pending.value).toBe(true)
        expect(loading.value).toBe(false)
        setTimeout(() => {
          expect(loading.value).toBe(false)
        }, 200)
        setTimeout(() => {
          expect(loading.value).toBe(true)
        }, 300)
        vi.runAllTimers()
      }
    })
    app.use(axues)
    createVueApp(app)
  })

  test('should false when request finish', () => {
    const app = createApp({
      setup () {
        async function test () {
          const { pending, loading, action } = useAxues('/get')
          expect(pending.value).toBe(false)
          await action()
          expect(pending.value).toBe(false)
          expect(loading.value).toBe(false)
        }
        test()
      }
    })
    app.use(axues)
    createVueApp(app)
  })
})
