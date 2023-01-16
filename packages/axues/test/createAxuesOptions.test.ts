import { describe, test, expect, vi } from 'vitest'
import { createAxues, useAxues } from '../src'
import axios from 'axios'
import { defineComponent, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import LRU from 'lru-cache'

// @vitest-environment happy-dom
const instance = axios.create({ baseURL: 'https://axues.io' })
let e: any = null
class NotFoundError extends Error {
  constructor (message: string) {
    super(message)
    this.name = this.constructor.name
  }
}
const cacheInstance = new LRU({
  maxSize: 100000,
  // https://github.com/isaacs/node-lru-cache/issues/231
  sizeCalculation: (value: string, key: string) => {
    return value.length + key.length
  },
  ttl: 1000 * 60 * 5
})
const axues = createAxues(instance, {
  responseHandle: response => {
    return response.data
  },
  errorHandle: err => {
    return new NotFoundError(err.message)
  },
  errorReport (err) {
    e = err
  },
  cacheInstance,
  loadingDelay: 500,
  overlayImplement: {
    loadingOpen (options) {
      console.log(options)
    },
    loadingClose () {
      console.log('loadingClose')
    },
    confirm (options) {
      console.log(options)
      return Promise.resolve()
    },
    success (options) {
      console.log(options)
    },
    error (options) {
      console.log(options)
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
describe('createAxuesOptions', () => {
  test('responseHandle', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/get',
          immediate: true
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    expect(wrapper.vm.pending).toBe(true)
    await flushPromises()
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })

  test('errorHandle and errorReport', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/getError',
          immediate: true
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    expect(wrapper.vm.pending).toBe(true)
    await flushPromises()
    expect(wrapper.vm.error).toBeInstanceOf(NotFoundError)
    expect(e).toBeInstanceOf(NotFoundError)
  })

  test('cacheKey is string', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action, requestTimes } = useAxues({
          url: '/get',
          cacheKey: 'test'
        })
        return { pending, loading, success, error, data, action, requestTimes }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.success).toBe(true)
    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.vm.data).toEqual({ test: 1 })
    expect(wrapper.vm.requestTimes).toBe(1)

    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.requestTimes).toBe(1)
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })

  test('cacheKey is ref', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action, requestTimes } = useAxues({
          url: '/get',
          cacheKey: ref('testRef')
        })
        return { pending, loading, success, error, data, action, requestTimes }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.success).toBe(true)
    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.vm.data).toEqual({ test: 1 })
    expect(wrapper.vm.requestTimes).toBe(1)

    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.requestTimes).toBe(1)
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })

  test('cacheKey is function', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action, requestTimes } = useAxues({
          url: '/get',
          cacheKey: actionPayload => `test-${actionPayload as string}`
        })
        return { pending, loading, success, error, data, action, requestTimes }
      },
      template: '<button @click="action(\'1\')" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.success).toBe(true)
    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.vm.data).toEqual({ test: 1 })
    expect(wrapper.vm.requestTimes).toBe(1)

    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.requestTimes).toBe(1)
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })

  test('loading delay', async () => {
    vi.useFakeTimers()
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues('/get')
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.vm.loading).toBe(false)
    await wrapper.get('button').trigger('click')
    expect(wrapper.vm.pending).toBe(true)
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.error).toBeNull()

    setTimeout(() => {
      expect(wrapper.vm.loading).toBe(false)
    }, 300)
    setTimeout(() => {
      expect(wrapper.vm.loading).toBe(true)
    }, 500)

    vi.runAllTimers()

    await flushPromises()

    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.success).toBe(true)
    expect(wrapper.vm.error).toBeNull()
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })
})
