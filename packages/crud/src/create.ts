import { ref } from 'vue'
import axios from 'axios'
import { mergeHeaders, transformParams } from './util'
import type { App } from 'vue'
import type { AxiosResponse } from 'axios'
import type { CreateCRUDOptions, OverlayImplement } from './types'
import { CRUDInput } from './types'

export const key = Symbol('')

export function createCRUD (options: CreateCRUDOptions) {
  const {
    baseURL = '',
    headers: baseHeaders,
    timeout: baseTimeout = 0,
    responseHandle,
    cache,
    errorReport,
    loadingDelay = 300
  } = options

  function request ({
    url = '',
    params = {},
    method = 'get',
    contentType = '',
    headers,
    timeout,
    responseType = 'json'
  }: any) {
    return new Promise((resolve, reject) => {
      axios({
        baseURL,
        url,
        data: transformParams(params, contentType),
        method,
        headers: mergeHeaders(baseHeaders, headers, contentType),
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

  function CRUD<TI, TO, TStart> ({
    url = '',
    params,
    method = 'get',
    contentType = '',
    headers,
    timeout,
    responseType = 'json',
    api,
    immediate = false,
    initialData = null as TO,
    debounce = 'first',
    debounceTime = 500,
    confirmOverlay,
    loadingOverlay,
    successOverlay,
    errorOverlay,
    onData,
    onSuccess,
    onError
  }: CRUDInput<TI, TO, TStart>) {
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

      const requestOptions = {
        url,
        params: typeof params === 'function' ? params(param) : params,
        method,
        contentType,
        headers,
        timeout,
        responseType
      }

      if (cache?.instance) {
        console.log('cache')
        console.log(debounceTime)
      }
      request(requestOptions)
        .then(res => {})
        .catch((err: Error) => {
          errorReport?.(err)
        })
        .finally(() => {
          pending.value = false
          loading.value = false
          refreshing.value = false
          clearTimeout(loadingTimer)
        })
    }
    const refresh = (param: any) => {
      refreshing.value = true
      start(param)
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
