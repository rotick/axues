import { describe, test, expect, vi } from 'vitest'
import { createAxues, useAxues } from '../src'
import axios from 'axios'
import { defineComponent, ref, computed, triggerRef } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

// @vitest-environment happy-dom
const axues = createAxues(
  axios.create({
    baseURL: 'https://axues.io'
  })
)

function getWrap (component: any) {
  return mount(component, {
    global: {
      plugins: [axues]
    }
  })
}

describe('url', () => {
  test('url is ref', async () => {
    const TestComponent = defineComponent({
      setup () {
        const url = ref('/get')
        const { pending, loading, success, error, data } = useAxues({
          url,
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)

    expect(wrapper.vm.pending).toBe(true)

    await flushPromises()
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })
  // todo do request when url change?

  test('url is computed', async () => {
    const TestComponent = defineComponent({
      setup () {
        const url = computed(() => '/get')
        const { pending, loading, success, error, data } = useAxues({
          url,
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)

    await flushPromises()
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })

  test('url is function', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, success, error, data } = useAxues({
          url: (actionPayload?: string) => `/getWithParams/${actionPayload || ''}`
        })
        return { pending, action, success, error, data }
      },
      // eslint-disable-next-line
      template: `<button @click="action('test')" class="action">action</button>`
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')

    await flushPromises()
    expect(wrapper.vm.data.params).toEqual('test')
  })
})

describe('params', () => {
  test('params is plain object', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/getWithParams/1',
          params: { foo: 'bar' },
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.vm.data.query).toEqual({ foo: 'bar' })
  })

  test('params is URLSearchParams', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/getWithParams/1',
          params: new URLSearchParams({ foo: 'bar' }),
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.vm.data.query).toEqual({ foo: 'bar' })
  })

  test('params is ref', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/getWithParams/1',
          params: ref({ foo: 'bar' }),
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.vm.data.query).toEqual({ foo: 'bar' })
  })

  test('params is function', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, success, error, data } = useAxues({
          url: '/getWithParams/1',
          params: (actonPayload: any) => ({ foo: actonPayload })
        })
        return { pending, action, success, error, data }
      },
      // eslint-disable-next-line
      template: `<button @click="action('test')" class="action">action</button>`
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')

    await flushPromises()
    expect(wrapper.vm.data.query).toEqual({ foo: 'test' })
  })
})

describe('data', () => {
  test('data is plain object', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          data: { foo: 'bar' },
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.vm.data.body).toEqual({ foo: 'bar' })
  })

  test('data is computed', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          data: computed(() => ({ foo: 'bar' })),
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.vm.data.body).toEqual({ foo: 'bar' })
  })

  test('data is ref', async () => {
    const reqData = ref({ foo: 'bar' })
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          data: reqData,
          immediate: true
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.vm.data.body).toEqual({ foo: 'bar' })
    reqData.value = { foo: 'baz' }
    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.data.body).toEqual({ foo: 'baz' })
  })

  test('data is function', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, success, error, data } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          data: (actonPayload: any) => ({ foo: actonPayload })
        })
        return { pending, action, success, error, data }
      },
      // eslint-disable-next-line
      template: `<button @click="action('test')" class="action">action</button>`
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')

    await flushPromises()
    expect(wrapper.vm.data.body).toEqual({ foo: 'test' })
  })
})

describe('headers', () => {
  test('headers is plain object', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          headers: { foo: 'bar' },
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.vm.data.headers.foo).toEqual('bar')
  })

  test('headers is computed', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          headers: computed(() => ({ foo: 'bar' })),
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.vm.data.headers.foo).toEqual('bar')
  })

  test('headers is ref', async () => {
    const reqData = ref({ foo: 'bar' })
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          headers: reqData,
          immediate: true
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.vm.data.headers.foo).toEqual('bar')
    reqData.value = { foo: 'baz' }
    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.data.headers.foo).toEqual('baz')
  })

  test('headers is function', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, success, error, data } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          headers: (actonPayload: any) => ({ foo: actonPayload })
        })
        return { pending, action, success, error, data }
      },
      // eslint-disable-next-line
      template: `<button @click="action('test')" class="action">action</button>`
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')

    await flushPromises()
    expect(wrapper.vm.data.headers.foo).toEqual('test')
  })
})

describe('contentType', () => {
  test('contentType is string', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          data: { foo: 'bar' },
          contentType: 'urlEncode',
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.vm.data.headers['content-type']).toBe('application/x-www-form-urlencoded')
  })

  test('contentType is ref', async () => {
    const ct = ref('urlEncode')
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          data: { foo: 'bar' },
          contentType: ct,
          immediate: true
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.vm.data.headers['content-type']).toBe('application/x-www-form-urlencoded')
    expect(wrapper.vm.data.body).toEqual({})

    ct.value = 'json'
    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.data.headers['content-type']).toBe('application/json')
    expect(wrapper.vm.data.body).toEqual({ foo: 'bar' })

    ct.value = 'formData'
    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.data.headers['content-type']).toBe('multipart/form-data')
    expect(wrapper.vm.data.body).toEqual({})
  })

  test('contentType is function', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          data: { foo: 'bar' },
          contentType: (actonPayload: any) => actonPayload
        })
        return { pending, loading, success, error, data, action }
      },
      // eslint-disable-next-line
      template: `<button @click="action('urlEncode')" class="action">action</button>`
    })
    const wrapper = getWrap(TestComponent)
    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.data.headers['content-type']).toBe('application/x-www-form-urlencoded')
  })
})

describe('promise', () => {
  test('promise resolve', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          promise: () => Promise.resolve({ foo: 'bar' }),
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)
    expect(wrapper.vm.pending).toBe(true)
    await flushPromises()
    expect(wrapper.vm.success).toBe(true)
    expect(wrapper.vm.data).toEqual({ foo: 'bar' })
    expect(wrapper.vm.error).toEqual(null)
  })

  test('promise reject', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          promise: () => Promise.reject(new Error('some error message')),
          immediate: true
        })
        return { pending, loading, success, error, data, action }
      }
    })
    const wrapper = getWrap(TestComponent)
    expect(wrapper.vm.pending).toBe(true)
    await flushPromises()
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.data).toEqual(null)
    expect(wrapper.vm.error.message).toEqual('some error message')
  })

  test('promise with params', async () => {
    const service = (msg: string) =>
      new Promise((resolve, reject) => {
        reject(new Error(msg))
      })
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          promise: actionPayload => service(actionPayload)
        })
        return { pending, loading, success, error, data, action }
      },
      // eslint-disable-next-line
      template: `<button @click="action('msg from action')" class="action">action</button>`
    })
    const wrapper = getWrap(TestComponent)

    wrapper.get('.action').trigger('click')
    expect(wrapper.vm.pending).toBe(true)
    await flushPromises()
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.data).toEqual(null)
    expect(wrapper.vm.error.message).toEqual('msg from action')
  })

  test('promise as first argument', async () => {
    const service = (actionPayload?: string, signal?: AbortSignal) =>
      axues({
        url: '/get',
        signal
      })
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action, abort, aborted } = useAxues(service)
        return { pending, loading, success, error, data, action, abort, aborted }
      },
      // eslint-disable-next-line
      template: `<button @click="action" class="action">action</button>
      <button @click="abort" class="abort">abort</button>`
    })
    const wrapper = getWrap(TestComponent)

    wrapper.get('.action').trigger('click')
    expect(wrapper.vm.pending).toBe(true)
    await flushPromises()
    expect(wrapper.vm.success).toBe(true)
    expect(wrapper.vm.data).toEqual({ test: 1 })

    await wrapper.get('.action').trigger('click')
    expect(wrapper.vm.pending).toBe(true)
    await wrapper.get('.abort').trigger('click')
    expect(wrapper.vm.aborted).toBe(true)
    expect(wrapper.vm.pending).toBe(false)
    await flushPromises()
    expect(wrapper.vm.success).toBe(false)
  })

  test('axues as first argument', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues(() => axues.get('/get'))
        return { pending, loading, success, error, data, action }
      },
      // eslint-disable-next-line
      template: `<button @click="action" class="action">action</button>`
    })
    const wrapper = getWrap(TestComponent)

    wrapper.get('.action').trigger('click')
    expect(wrapper.vm.pending).toBe(true)
    await flushPromises()
    expect(wrapper.vm.success).toBe(true)
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })
})

describe('axues only options', () => {
  test('immediate', async () => {
    vi.useFakeTimers()
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/get',
          immediate: true
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)

    expect(wrapper.vm.pending).toBe(true)
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.error).toBeNull()

    setTimeout(() => {
      expect(wrapper.vm.loading).toBe(false)
    }, 200)
    setTimeout(() => {
      expect(wrapper.vm.loading).toBe(true)
    }, 300)

    vi.runAllTimers()

    await flushPromises()

    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.success).toBe(true)
    expect(wrapper.vm.error).toBeNull()
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })

  test('initialData and onData when success', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/get',
          immediate: true,
          initialData: {
            page: 1,
            total: 50,
            records: {}
          },
          onData (data, newData: any) {
            data.value.records = newData
          }
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)
    expect(wrapper.vm.data).toEqual({
      page: 1,
      total: 50,
      records: {}
    })
    await flushPromises()
    expect(wrapper.vm.data).toEqual({
      page: 1,
      total: 50,
      records: { test: 1 }
    })
  })

  test('initialData and onData when error', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/getError',
          immediate: true,
          initialData: {
            page: 1,
            total: 50,
            records: {}
          },
          onData (data, newData: any) {
            data.value.records = newData
          }
        })
        return { pending, loading, success, error, data }
      }
    })
    const wrapper = getWrap(TestComponent)
    expect(wrapper.vm.data).toEqual({
      page: 1,
      total: 50,
      records: {}
    })
    await flushPromises()
    expect(wrapper.vm.data).toEqual({
      page: 1,
      total: 50,
      records: {}
    })
  })

  test('shallow', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/get',
          immediate: true,
          shallow: true,
          initialData: {
            page: 1,
            total: 50,
            records: {}
          },
          onData (data, newData: any) {
            data.value.records = newData
          }
        })
        return { pending, loading, success, error, data }
      },
      template: '<div>{{ data.records.test }}</div>'
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.find('div').text()).not.toBe('1')
  })

  test('shallow with triggerRef', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data } = useAxues({
          url: '/get',
          immediate: true,
          shallow: true,
          initialData: {
            page: 1,
            total: 50,
            records: {}
          },
          onData (data, newData: any) {
            data.value.records = newData
            triggerRef(data)
          }
        })
        return { pending, loading, success, error, data }
      },
      template: '<div>{{ data.records.test }}</div>'
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.find('div').text()).toBe('1')
  })

  test('debounce: undefined(default)', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, requestTimes } = useAxues({
          url: '/get'
        })
        return { pending, action, requestTimes }
      },
      template: '<button @click="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.vm.requestTimes).toBe(1)
  })

  test('debounce: true', async () => {
    vi.useFakeTimers()
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, requestTimes } = useAxues({
          url: '/get',
          debounce: true
        })
        return { pending, action, requestTimes }
      },
      template: '<button @click="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    setTimeout(() => {
      expect(wrapper.vm.pending).toBe(false)
    }, 400)
    setTimeout(() => {
      expect(wrapper.vm.pending).toBe(true)
    }, 500)
    vi.runAllTimers()
    await flushPromises()
    expect(wrapper.vm.requestTimes).toBe(1)
  })

  test('debounce: true with debounceTime', async () => {
    vi.useFakeTimers()
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, requestTimes } = useAxues({
          url: '/get',
          debounce: true,
          debounceTime: 1000
        })
        return { pending, action, requestTimes }
      },
      template: '<button @click="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    setTimeout(() => {
      expect(wrapper.vm.pending).toBe(false)
    }, 600)
    setTimeout(() => {
      expect(wrapper.vm.pending).toBe(true)
    }, 1000)
    vi.runAllTimers()
    await flushPromises()
    expect(wrapper.vm.requestTimes).toBe(1)
  })

  test('debounce: false', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, requestTimes } = useAxues({
          url: '/get',
          debounce: false
        })
        return { pending, action, requestTimes }
      },
      template: '<button @click="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.vm.requestTimes).toBe(3)
  })

  test('cache', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, success, requestTimes, data } = useAxues({
          url: '/get',
          cacheKey: 'test'
        })
        return { pending, action, success, requestTimes, data }
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
    expect(wrapper.vm.requestTimes).toBe(2)
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })

  test('throwOnActionFailed', async () => {
    let e = null
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, data, error } = useAxues({
          url: '/getError',
          throwOnActionFailed: true
        })
        action().then(
          () => {},
          err => {
            e = err
          }
        )
        return { pending, action, data, error }
      },
      template: '<button @click="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await flushPromises()
    expect(e).toBeInstanceOf(Error)
    expect(wrapper.vm.error).toEqual(e)
  })

  test('onSuccess and onFinally', async () => {
    let d = {}
    let a = 0
    let f = 0
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, data } = useAxues({
          url: '/get',
          onSuccess: (data, actionPayload) => {
            d = data
            a = actionPayload
          },
          onFinally (actionPayload) {
            f = actionPayload
          }
        })
        return { pending, action, data }
      },
      template: '<button @click="action(1)">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(d).toEqual({ test: 1 })
    expect(a).toBe(1)
    expect(f).toBe(1)
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })

  test('onError and onFinally', async () => {
    let d = {}
    let a = 0
    let f = 0
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, data, error } = useAxues({
          url: '/getError',
          onError: (err, actionPayload) => {
            d = err
            a = actionPayload
          },
          onFinally (actionPayload) {
            f = actionPayload
          }
        })
        return { pending, action, data, error }
      },
      template: '<button @click="action(1)">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(d).toBeInstanceOf(Error)
    expect(a).toBe(1)
    expect(f).toBe(1)
    expect(wrapper.vm.error).toBeInstanceOf(Error)
  })
})
