import { ref } from 'vue'
import axios from 'axios'
import {
  mergeHeaders,
  transformConfirmOptions,
  transformErrorOptions,
  transformLoadingOptions,
  transformParams,
  transformSuccessOptions
} from './util'
import type { App, Ref } from 'vue'
import type { AxiosResponse } from 'axios'
import type { CreateCRUDOptions, OverlayImplement } from './types'
import { CRUDInput } from './types'

export const key = Symbol('')

export function createCRUD ({
  baseURL = '',
  headers: baseHeaders,
  timeout: baseTimeout = 0,
  responseHandle,
  cache,
  errorReport,
  loadingDelay = 300,
  overlayImplement: baseOverlayImplement
}: CreateCRUDOptions) {
  const request = ({
    url = '',
    params = {},
    method = 'get',
    contentType = '',
    headers,
    timeout,
    responseType = 'json'
  }: any) => {
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
  let overlayInstance: OverlayImplement | undefined = baseOverlayImplement
  const overlayImplement = (options: OverlayImplement) => {
    overlayInstance = options
  }

  const CRUD = <TI, TO, TStart>({
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
    onData = (data, newData) => {
      data.value = newData as TO
    },
    onSuccess,
    onError
  }: CRUDInput<TI, TO, TStart>) => {
    const pending = ref(false)
    const loading = ref(false)
    const success = ref(false)
    const error = ref<Error | null>(null)
    const refreshing = ref(false)
    const data = ref(initialData) as Ref<TO>

    let requestTimes = 0
    let initialRequestOptions: any = null
    const getRequestOptions = (param?: TStart) => {
      const opt = {
        url,
        params: typeof params === 'function' ? params(param) : params,
        method,
        contentType,
        headers: mergeHeaders(baseHeaders, headers, contentType),
        timeout,
        responseType
      }
      if (requestTimes === 0) {
        initialRequestOptions = opt
      }
      return opt
    }

    const run = (param?: TStart, options?: any) => {
      pending.value = true
      const loadingTimer = setTimeout(() => {
        loading.value = true
        if (loadingOverlay) {
          overlayInstance?.loadingOpen?.(
            transformLoadingOptions<TStart>(loadingOverlay, param)
          )
        }
      }, loadingDelay)

      const requestOptions = getRequestOptions(param)
      requestTimes++

      if (cache?.instance) {
        console.log('cache')
      }
      let requestApi = request(options || requestOptions)

      if (api && Array.isArray(api)) {
        requestApi = Promise.all(api)
      } else if (api) {
        requestApi = api
      }

      requestApi
        .then((res: unknown) => {
          onData(data, res)
          success.value = true
          onSuccess?.(data.value)
          if (successOverlay) {
            overlayInstance?.success?.(
              transformSuccessOptions<TStart, TO>(
                successOverlay,
                param,
                data.value
              )
            )
          }
        })
        .catch((err: Error) => {
          onError?.(err)
          if (errorOverlay) {
            overlayInstance?.error?.(
              transformErrorOptions<TStart>(errorOverlay, param, err)
            )
          }
          errorReport?.(err)
        })
        .finally(() => {
          pending.value = false
          loading.value = false
          refreshing.value = false
          clearTimeout(loadingTimer)
        })
    }

    const refresh = (param?: TStart) => {
      refreshing.value = true
      run(param, initialRequestOptions)
    }

    const start = (param?: TStart) => {
      if (confirmOverlay) {
        overlayInstance
          ?.confirm?.(transformConfirmOptions<TStart>(confirmOverlay, param))
          .then(() => {
            run(param)
          })
      } else {
        run(param)
      }
    }

    if (immediate) start()

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
