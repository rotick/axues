import { describe, test, expect, vi } from 'vitest'
import { createAxues, useAxues } from '../src'
import axios from 'axios'
import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

// @vitest-environment happy-dom

describe('basic', () => {
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

  test('state should correct when request success', async () => {
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

  test('state should correct when request error', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action, refreshing, refresh } = useAxues('/getError')
        return { pending, loading, success, error, data, action, refreshing, refresh }
      },
      template: `<button @click="action" class="action">action</button>
      <button @click="refresh" class="refresh">refresh</button>`
    })
    const wrapper = getWrap(TestComponent)

    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.vm.loading).toBe(false)
    await wrapper.get('.action').trigger('click')
    expect(wrapper.vm.pending).toBe(true)
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.error).toBeNull()

    await flushPromises()

    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.error).toBeInstanceOf(Error)
    expect(wrapper.vm.data).toBeNull()

    expect(wrapper.vm.refreshing).toBe(false)
    await wrapper.get('.refresh').trigger('click')
    expect(wrapper.vm.refreshing).toBe(true)
    expect(wrapper.vm.pending).toBe(true)
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.error).toBeInstanceOf(Error)

    await flushPromises()

    expect(wrapper.vm.refreshing).toBe(false)
    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.error).toBeInstanceOf(Error)
    expect(wrapper.vm.data).toBeNull()
  })

  test('retry when error', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, error, action, requestTimes, retrying, retryTimes, retryCountdown, retry } = useAxues('/getError')
        return { pending, error, action, requestTimes, retrying, retryTimes, retryCountdown, retry }
      },
      template: `<button @click="action" class="action">action</button>
      <button @click="retry" class="retry">retry</button>`
    })
    const wrapper = getWrap(TestComponent)

    // expect(() => wrapper.vm.retry()).toThrowError(/called/)
    await wrapper.get('.retry').trigger('click')
  })
})
