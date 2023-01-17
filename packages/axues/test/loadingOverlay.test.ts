import { describe, test, expect, vi } from 'vitest'
import { createAxues, useAxues } from '../src'
import axios from 'axios'
import { computed, defineComponent, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

// @vitest-environment happy-dom
const instance = axios.create({ baseURL: 'https://axues.io' })
let loadingOptions: any = null
let loadingClosed = false
const axues = createAxues(instance, {
  loadingDelay: 0,
  overlayImplement: {
    loadingOpen (options) {
      loadingOptions = options
    },
    loadingClose () {
      loadingClosed = true
    }
  }
})

function getWrap (component: any) {
  return mount(component, {
    global: {
      plugins: [axues]
    }
  })
}
describe('loadingOverlay', () => {
  test('with bool', async () => {
    vi.useFakeTimers()
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/get',
          loadingOverlay: ref(true)
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action()" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    vi.runAllTimers()
    await flushPromises()
    expect(loadingOptions).toEqual({
      style: 1,
      text: ''
    })
    expect(loadingClosed).toBeTruthy()
  })

  test('with text', async () => {
    vi.useFakeTimers()
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/get',
          loadingOverlay: computed(() => 'loading')
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action()" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    vi.runAllTimers()
    await flushPromises()
    expect(loadingOptions).toEqual({
      style: 1,
      text: 'loading'
    })
    expect(loadingClosed).toBeTruthy()
  })

  test('with object', async () => {
    vi.useFakeTimers()
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/get',
          loadingOverlay: {
            style: 2
          }
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action()" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    vi.runAllTimers()
    await flushPromises()
    expect(loadingOptions).toEqual({
      style: 2,
      text: ''
    })
    expect(loadingClosed).toBeTruthy()
  })

  test('with function', async () => {
    vi.useFakeTimers()
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/get',
          loadingOverlay: actionPayload => ({
            style: 2,
            text: `loading ${actionPayload as string}`
          })
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action(\'1\')" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    vi.runAllTimers()
    await flushPromises()
    expect(loadingOptions).toEqual({
      style: 2,
      text: 'loading 1'
    })
    expect(loadingClosed).toBeTruthy()
  })
})
