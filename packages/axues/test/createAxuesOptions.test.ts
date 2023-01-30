import { describe, test, expect, vi } from 'vitest'
import { createAxues, useAxues, useOverlayImplement, axues as axues1 } from '../src'
import axios from 'axios'
import { computed, defineComponent, ref } from 'vue'
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
let confirmOptions: any = null
let loadingOptions: any = null
let loadingClosed = false
let successOptions: any = null
let errorOptions: any = null
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
      loadingOptions = options
    },
    loadingClose () {
      loadingClosed = true
    },
    confirm (options) {
      confirmOptions = options
      return Promise.resolve()
    },
    success (options) {
      successOptions = options
    },
    error (options) {
      errorOptions = options
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

  test('confirm, loading, success overlay', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/get',
          confirmOverlay: 'are you sure?',
          loadingOverlay: ref(true),
          successOverlay: computed(() => 'success')
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action()" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    expect(confirmOptions).toEqual({
      style: 1,
      title: 'are you sure?',
      content: '',
      requireInputContent: false
    })
    await flushPromises()
    // expect(loadingOptions).toEqual({
    //   style: 1,
    //   text: ''
    // })
    expect(loadingOptions).toEqual(null)
    expect(loadingClosed).toBeTruthy()
    expect(successOptions).toEqual({
      style: 1,
      title: 'success',
      content: '',
      callback: undefined
    })
    expect(errorOptions).toEqual(null)
  })

  test('error overlay', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/getError',
          confirmOverlay: actionPayload => `are you sure ${actionPayload as string}?`,
          loadingOverlay: ref('loading'),
          errorOverlay: actionPayload => ({
            style: 2,
            title: `get an error ${actionPayload as string}`
          })
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action(\'1\')" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    expect(confirmOptions).toEqual({
      style: 1,
      title: 'are you sure 1?',
      content: '',
      requireInputContent: false
    })
    await flushPromises()
    expect(loadingOptions).toEqual(null)
    expect(loadingClosed).toBeTruthy()
    expect(errorOptions).toEqual({
      style: 2,
      title: 'get an error 1',
      content: '',
      callback: undefined
    })
  })

  test('useOverlayImplement', async () => {
    const TestComponent = defineComponent({
      setup () {
        useOverlayImplement({
          success (options) {
            successOptions = Object.assign({ test: 1 }, options)
          }
        })
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/get',
          successOverlay: actionPayload => ({
            style: 2,
            title: `success ${actionPayload as string}`
          })
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action(\'1\')" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(successOptions).toEqual({
      test: 1,
      style: 2,
      title: 'success 1',
      content: '',
      callback: undefined
    })
  })

  test('axues', async () => {
    const data = await axues({
      url: '/get'
    })
    expect(data).toEqual({ test: 1 })
  })

  test('axues.get', async () => {
    const data = await axues.get('/get')
    expect(data).toEqual({ test: 1 })
  })

  test('axues.post', async () => {
    const data = await axues.post('/postWithJsonData', { foo: 'bar' })
    expect(data.body).toEqual({ foo: 'bar' })
  })

  test('axues with errorHandle', () => {
    expect(() => axues.get('/getError')).rejects.toThrowError()
    expect(() => axues.get('/getError')).rejects.toBeInstanceOf(NotFoundError)
  })

  test('axues1 with errorHandle', () => {
    expect(() => axues1.get('/getError')).rejects.toThrowError()
    expect(() => axues1.get('/getError')).rejects.toBeInstanceOf(NotFoundError)
  })
})
