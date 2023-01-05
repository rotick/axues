import { describe, expect, test } from 'vitest'
import { createApp } from 'vue'
import axios from 'axios'
import { createAxues, useAxues } from '../src'

describe('loading', () => {
  test('pending state should right', () => {
    const axiosInstance = axios.create({
      baseURL: '/'
    })
    const axues = createAxues(axiosInstance)
    const app = createApp({
      setup () {
        const { pending } = useAxues('/get')
        expect(pending.value).toBe(false)
      }
    })
    app.use(axues)
  })
})
