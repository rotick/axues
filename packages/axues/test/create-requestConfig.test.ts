import { describe, test, expect } from 'vitest'
import { createAxues, useAxues } from '../src'
import axios from 'axios'
import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

// @vitest-environment happy-dom
describe('requestConfig', () => {
  const instance = axios.create({
    baseURL: 'https://axues.io',
    headers: { abc: 1 }
  })
  let foo = 'bar'
  const axues = createAxues(instance, {
    requestConfig: () => ({
      headers: { Authorization: foo }
    })
  })

  function getWrap (component: any) {
    return mount(component, {
      global: {
        plugins: [axues]
      }
    })
  }
  test('requestConfig should call every request', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { pending, loading, success, error, data, action } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          immediate: true
        })
        return { pending, loading, success, error, data, action }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    const wrapper = getWrap(TestComponent)

    expect(wrapper.vm.pending).toBe(true)
    await flushPromises()
    expect(wrapper.vm.data.headers.abc).toBe('1')
    expect(wrapper.vm.data.headers.authorization).toBe('bar')

    foo = 'baz'
    await wrapper.get('.action').trigger('click')
    await flushPromises()
    expect(wrapper.vm.data.headers.authorization).toBe('baz')
  })
})
