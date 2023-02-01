import { describe, test, expect } from 'vitest'
import { createAxues } from '../src'
import axios from 'axios'
import { defineComponent } from 'vue'
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

describe('logic component', () => {
  // todo now got an error, how to test it?
  test.skip('should work', async () => {
    const TestComponent = defineComponent({
      template: `<axues url="/get" v-slot="{ pending, data, action }">
        <p v-if="pending" class="loading">pending...</p>
        <p class="data">{{ data.test }}</p>
        <button class="action" @click="action"></button>
      </axues>`
    })
    const wrapper = getWrap(TestComponent)

    await wrapper.get('.action').trigger('click')
    expect(wrapper.find('.pending').exists()).toBeTruthy()

    await flushPromises()
    expect(wrapper.find('.data').text()).toEqual('1')
  })
})
