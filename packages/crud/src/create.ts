import { ref } from 'vue'
import axios from 'axios'
import type { App } from 'vue'
import type { AxiosResponse } from 'axios'
import { CreateCRUDOptions, OverlayImplement } from './types'

export const key = Symbol('')

export function createCRUD (options: CreateCRUDOptions) {
  const {
    baseURL = '',
    headers: baseHeaders,
    timeout: baseTimeout = 0,
    responseHandle,
    cache,
    errorReport,
    loadingDelay = 300,
    debounceTime = 500
  } = options

  function request ({
    url = '',
    params = {},
    method = 'get',
    contentType = '',
    headers,
    timeout,
    responseType
  }: any) {
    return new Promise((resolve, reject) => {
      axios({
        baseURL,
        url,
        data: params,
        method,
        headers: {
          ...baseHeaders,
          ...headers,
          'Content-Type': contentType
        },
        responseType,
        timeout: timeout || baseTimeout
      })
        .then((response: AxiosResponse) => {
          const res = responseHandle?.(response.data) || response.data
          if (res instanceof Error) {
            reject(res)
          } else {
            resolve(res)
          }
        })
        .catch(reject)
    })
  }

  function overlayImplement (options: OverlayImplement) {}

  function CRUD () {
    const pending = ref(false)
    const loading = ref(false)
    const success = ref(false)
    const error = ref<Error | null>(null)
    const refreshing = ref(false)
    const data = ref(null)

    const start = (param: any) => {
      pending.value = true
      const loadingTimer = setTimeout(() => {
        loading.value = true
      }, loadingDelay)
      if (cache?.instance) {
        console.log('cache')
        console.log(debounceTime)
      }
      request({
        timeout: baseTimeout,
        method: 'get',
        url: '',
        params: {},
        headers: {},
        responseHandle
      })
        .then(res => {})
        .catch((err: Error) => {
          errorReport?.(err)
        })
        .finally(() => {
          clearTimeout(loadingTimer)
        })
    }
    const refresh = (param: any) => {
      refreshing.value = true
    }
    return {
      pending,
      loading,
      success,
      error,
      refreshing,
      data,
      start,
      refresh
    }
  }
  return {
    request,
    overlayImplement,
    CRUD,
    install (app: App) {
      app.provide(key, {
        request,
        overlayImplement,
        CRUD
      })
    }
  }
}
