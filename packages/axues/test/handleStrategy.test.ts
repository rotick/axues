import { describe, test, expect } from 'vitest'
import { createAxues, useAxues } from '../src'
import axios from 'axios'
import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
// @vitest-environment happy-dom
let resStrategy = 0
let errStrategy = 0
let errStrategyInRes = 0
const instance = axios.create({ baseURL: 'https://axues.io' })
const axues = createAxues(instance, {
  transformUseOptions: options => {
    if (options.errorOverlay) {
      options.errorHandlingStrategy = 2
    }
    if (options.method === 'post') {
      options.responseHandlingStrategy = 1
    }
    return options
  },
  responseHandle: (response, { responseHandlingStrategy, errorHandlingStrategy }) => {
    resStrategy = responseHandlingStrategy || 0
    errStrategyInRes = errorHandlingStrategy || 0
    return response.data
  },
  errorHandle: (err, { errorHandlingStrategy }) => {
    console.log('111111111111', errorHandlingStrategy)
    errStrategy = errorHandlingStrategy || 0
    return err
  }
})

function getWrap (component: any) {
  return mount(component, {
    global: {
      plugins: [axues]
    }
  })
}

describe('handlingStrategy', () => {
  test('errorHandlingStrategy in resHandle', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { action } = useAxues({
          url: '/get',
          immediate: true,
          errorOverlay: 'foo'
        })
        return { action }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    getWrap(TestComponent)
    expect(errStrategyInRes).toBe(0)
    expect(errStrategy).toBe(0)
    expect(resStrategy).toBe(0)

    await flushPromises()
    expect(resStrategy).toBe(0)
    expect(errStrategyInRes).toBe(2)
    expect(errStrategy).toBe(0)
  })

  test('errorHandlingStrategy with error', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { action } = useAxues({
          url: '/getError',
          immediate: true,
          errorOverlay: 'foo'
        })
        return { action }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    getWrap(TestComponent)
    expect(errStrategy).toBe(0)

    await flushPromises()
    expect(errStrategy).toBe(2)
  })

  test('responseHandlingStrategy', async () => {
    const TestComponent = defineComponent({
      setup () {
        const { action } = useAxues({
          url: '/postWithJsonData',
          method: 'post',
          immediate: true,
          errorOverlay: 'foo'
        })
        return { action }
      },
      template: '<button @click="action" class="action">action</button>'
    })
    getWrap(TestComponent)
    expect(resStrategy).toBe(0)

    await flushPromises()
    expect(resStrategy).toBe(1)
  })
})
