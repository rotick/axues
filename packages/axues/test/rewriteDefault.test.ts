import { describe, test, expect, vi } from 'vitest'
import { createAxues, useAxues } from '../src'
import axios from 'axios'
import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
// @vitest-environment happy-dom

const instance = axios.create({ baseURL: 'https://axues.io' })

describe('rewriteDefault', () => {
  test('immediate', async () => {
    const axues = createAxues(instance, {
      rewriteDefault: {
        immediate: true
      }
    })

    function getWrap (component: any) {
      return mount(component, {
        global: {
          plugins: [axues]
        }
      })
    }
    const TestComponent = defineComponent({
      setup () {
        const { action, data } = useAxues({
          url: '/get'
        })
        return { action, data }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    await flushPromises()
    expect(wrapper.vm.data).toEqual({ test: 1 })
  })

  test('shallow', async () => {
    const axues = createAxues(instance, {
      rewriteDefault: {
        shallow: true
      }
    })

    function getWrap (component: any) {
      return mount(component, {
        global: {
          plugins: [axues]
        }
      })
    }
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
      },
      template: '<div>{{ data.records.test }}</div>'
    })
    const wrapper = getWrap(TestComponent)
    await flushPromises()
    expect(wrapper.find('div').text()).not.toBe('1')
  })

  test('debounce', async () => {
    const axues = createAxues(instance, {
      rewriteDefault: {
        debounce: false
      }
    })

    function getWrap (component: any) {
      return mount(component, {
        global: {
          plugins: [axues]
        }
      })
    }
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
    expect(wrapper.vm.requestTimes).toBe(3)
  })

  test('loadingDelay', async () => {
    const axues = createAxues(instance, {
      rewriteDefault: {
        loadingDelay: 500
      }
    })

    function getWrap (component: any) {
      return mount(component, {
        global: {
          plugins: [axues]
        }
      })
    }
    vi.useFakeTimers()
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/get'
        })
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

  test('debounceTime', async () => {
    const axues = createAxues(instance, {
      rewriteDefault: {
        debounceTime: 1000
      }
    })

    function getWrap (component: any) {
      return mount(component, {
        global: {
          plugins: [axues]
        }
      })
    }
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
    }, 600)
    setTimeout(() => {
      expect(wrapper.vm.pending).toBe(true)
    }, 1000)
    vi.runAllTimers()
    await flushPromises()
    expect(wrapper.vm.requestTimes).toBe(1)
  })

  test('throwOnActionFailed', async () => {
    const axues = createAxues(instance, {
      rewriteDefault: {
        throwOnActionFailed: true
      }
    })

    function getWrap (component: any) {
      return mount(component, {
        global: {
          plugins: [axues]
        }
      })
    }
    let e = null
    const TestComponent = defineComponent({
      setup () {
        const { pending, action, data, error } = useAxues({
          url: '/getError'
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

  test('autoRetryTimes', async () => {
    const axues = createAxues(instance, {
      rewriteDefault: {
        autoRetryTimes: 2
      }
    })

    function getWrap (component: any) {
      return mount(component, {
        global: {
          plugins: [axues]
        }
      })
    }
    const TestComponent = defineComponent({
      setup () {
        const { error, retryCountdown, action, retryTimes, retry } = useAxues('/getError')
        return { retryCountdown, error, action, retryTimes, retry }
      },
      template: `<button @click="action" class="action">action</button>
      <button @click="retry" class="retry">retry</button>`
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')

    await flushPromises()
    expect(wrapper.vm.error).toBeInstanceOf(Error)
    expect(wrapper.vm.retryCountdown).toBe(3)
    expect(wrapper.vm.retryTimes).toBe(1)

    await wrapper.get('.retry').trigger('click')
    expect(wrapper.vm.retryTimes).toBe(1)
    await flushPromises()
    expect(wrapper.vm.retryTimes).toBe(2)
    expect(wrapper.vm.error).toBeInstanceOf(Error)
    expect(wrapper.vm.retryCountdown).toBe(6)
  })
})
