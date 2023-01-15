import { describe, test, expect } from 'vitest'
import { createAxues, useAxues } from '../src'
import axios from 'axios'
import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

// @vitest-environment happy-dom
const instance = axios.create({ baseURL: 'https://axues.io' })
describe('responseHandle', () => {
  const axues = createAxues(instance, {
    responseHandle: response => {
      return response.data
    }
  })

  function getWrap (component: any) {
    return mount(component, {
      global: {
        plugins: [axues]
      }
    })
  }
  test('should work', async () => {
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
})
