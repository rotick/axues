import { describe, test, expect, vi } from 'vitest'
import { createAxues, useAxues, axues } from '../src'
import axios from 'axios'
import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

// @vitest-environment happy-dom

describe('basic', () => {
  const axues1 = createAxues(
    axios.create({
      baseURL: 'https://axues.io'
    })
  )
  function getWrap (component: any) {
    return mount(component, {
      global: {
        plugins: [axues1]
      }
    })
  }

  test('state should correct when request success', async () => {
    vi.useFakeTimers()
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action, resetAction, requestTimes } = useAxues('/get')
        return { pending, loading, success, error, data, action, resetAction, requestTimes }
      },
      template: '<button @click="action" class="action">action</button><button @click="resetAction" class="reset-action">resetAction</button>'
    })
    const wrapper = getWrap(TestComponent)

    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.vm.loading).toBe(false)
    await wrapper.get('.action').trigger('click')
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

    await wrapper.get('.action').trigger('click')
    expect(wrapper.vm.pending).toBe(true)
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.requestTimes).toBe(2)
    await wrapper.get('.reset-action').trigger('click')
    expect(wrapper.vm.pending).toBe(true)
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.requestTimes).toBe(1)
  })

  test('state should correct when request error', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action, refreshing, refreshed, refresh, requestTimes, resetAction } = useAxues('/getError')
        return { pending, loading, success, error, data, action, refreshing, refreshed, refresh, requestTimes, resetAction }
      },
      template: `<button @click="action" class="action">action</button>
      <button @click="refresh" class="refresh">refresh</button><button @click="resetAction" class="resetAction">resetAction</button>`
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
    expect(wrapper.vm.requestTimes).toBe(1)

    expect(wrapper.vm.refreshing).toBe(false)
    expect(wrapper.vm.refreshed).toBe(false)
    await wrapper.get('.refresh').trigger('click')
    expect(wrapper.vm.refreshing).toBe(true)
    expect(wrapper.vm.pending).toBe(true)
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.error).toBeInstanceOf(Error)

    await flushPromises()

    expect(wrapper.vm.refreshing).toBe(false)
    expect(wrapper.vm.refreshed).toBe(true)
    expect(wrapper.vm.requestTimes).toBe(1)
    expect(wrapper.vm.pending).toBe(false)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.error).toBeInstanceOf(Error)
    expect(wrapper.vm.data).toBeNull()

    await wrapper.get('.refresh').trigger('click')
    expect(wrapper.vm.refreshing).toBe(true)
    expect(wrapper.vm.error).toBeInstanceOf(Error)

    await wrapper.get('.resetAction').trigger('click')
    expect(wrapper.vm.refreshing).toBe(false)
    expect(wrapper.vm.error).toBe(null)
  })

  test('retry when error', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, error, action, requestTimes, retrying, retryTimes, retry, resetAction } = useAxues('/getError')
        return { pending, error, action, requestTimes, retrying, retryTimes, retry, resetAction }
      },
      template: `<button @click="action" class="action">action</button>
      <button @click="retry" class="retry">retry</button><button @click="resetAction" class="resetAction">resetAction</button>`
    })
    const wrapper = getWrap(TestComponent)

    await expect(() => wrapper.vm.retry()).rejects.toThrowError(/Retry can/)
    await wrapper.get('.action').trigger('click')

    await flushPromises()
    expect(wrapper.vm.error).toBeInstanceOf(Error)

    await wrapper.get('.retry').trigger('click')
    expect(wrapper.vm.retrying).toBe(true)
    expect(wrapper.vm.pending).toBe(true)
    expect(wrapper.vm.retryTimes).toBe(1)
    expect(wrapper.vm.requestTimes).toBe(2)

    await flushPromises()
    expect(wrapper.vm.error).toBeInstanceOf(Error)

    await wrapper.get('.retry').trigger('click')
    expect(wrapper.vm.retrying).toBe(true)
    expect(wrapper.vm.pending).toBe(true)
    expect(wrapper.vm.retryTimes).toBe(2)
    expect(wrapper.vm.requestTimes).toBe(3)

    await wrapper.get('.resetAction').trigger('click')
    expect(wrapper.vm.retrying).toBe(false)
    expect(wrapper.vm.pending).toBe(true)
    expect(wrapper.vm.retryTimes).toBe(0)
    expect(wrapper.vm.requestTimes).toBe(1)
  })

  test('retry count down', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { error, retryCountdown, action, retryTimes, retry, resetAction } = useAxues('/getError', {
          autoRetryTimes: 2
        })
        return { retryCountdown, error, action, retryTimes, retry, resetAction }
      },
      template: `<button @click="action" class="action">action</button>
      <button @click="retry" class="retry">retry</button><button @click="resetAction" class="resetAction">resetAction</button>`
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

    await wrapper.get('.resetAction').trigger('click')
    expect(wrapper.vm.retryTimes).toBe(0)
    expect(wrapper.vm.error).toBe(null)
    expect(wrapper.vm.retryCountdown).toBe(0)
  })

  test('refresh', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { success, data, action, refreshing, refresh, refreshed, requestTimes, resetAction } = useAxues('/get')
        return { success, data, action, refreshing, refresh, refreshed, requestTimes, resetAction }
      },
      template: `<button @click="action" class="action">action</button>
      <button @click="refresh" class="refresh">refresh</button><button @click="resetAction" class="resetAction">resetAction</button>`
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')

    await flushPromises()
    expect(wrapper.vm.success).toBe(true)
    expect(wrapper.vm.refreshing).toBe(false)
    expect(wrapper.vm.refreshed).toBe(false)
    expect(wrapper.vm.requestTimes).toBe(1)

    await wrapper.get('.refresh').trigger('click')
    expect(wrapper.vm.refreshing).toBe(true)
    expect(wrapper.vm.data).toEqual({ test: 1 })
    expect(wrapper.vm.success).toBe(true)

    await flushPromises()
    expect(wrapper.vm.refreshing).toBe(false)
    expect(wrapper.vm.refreshed).toBe(true)
    expect(wrapper.vm.requestTimes).toBe(1)
    expect(wrapper.vm.data).toEqual({ test: 1 })
    expect(wrapper.vm.success).toBe(true)

    await wrapper.get('.resetAction').trigger('click')
    expect(wrapper.vm.refreshed).toBe(false)
    expect(wrapper.vm.requestTimes).toBe(1)
    expect(wrapper.vm.data).toBe(null)
    expect(wrapper.vm.success).toBe(false)
  })

  test('abort', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { canAbort, aborted, action, abort, pending, success, resetAction } = useAxues('/get')
        return { canAbort, aborted, action, abort, pending, success, resetAction }
      },
      template: `<button @click="action" class="action">action</button>
      <button @click="abort" class="abort">abort</button><button @click="resetAction" class="resetAction">resetAction</button>`
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    expect(wrapper.vm.pending).toBe(true)
    expect(wrapper.vm.canAbort).toBe(true)
    expect(wrapper.vm.aborted).toBe(false)

    await wrapper.get('.abort').trigger('click')
    expect(wrapper.vm.aborted).toBe(true)
    expect(wrapper.vm.pending).toBe(false)
    await flushPromises()
    expect(wrapper.vm.success).toBe(false)

    await wrapper.get('.resetAction').trigger('click')
    expect(wrapper.vm.aborted).toBe(false)
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

  test('axues1.get', async () => {
    const data = await axues1.get('/get')
    expect(data).toEqual({ test: 1 })
  })

  test('axues.post', async () => {
    const data = await axues.post('/postWithJsonData', { foo: 'bar' })
    expect(data.body).toEqual({ foo: 'bar' })
  })
})
