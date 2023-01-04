import { describe, expect, test } from 'vitest'
import { createApp } from 'vue'
import axios from 'axios'
import { createAxues, useAxues } from '../src'

describe('loading', () => {
  const axiosInstance = axios.create({
    baseURL: '/'
  })
  const axues = createAxues(axiosInstance)
  const app = createApp({
    setup () {
      const { pending } = useAxues('/get')
      test('pending state should right', () => {
        expect(pending.value).toBe(true)
      })
    }
  })
  app.use(axues)
})
