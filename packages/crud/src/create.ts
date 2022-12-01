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
import { debounce } from './debounce'
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
    debounceMode = 'firstOnly',
    debounceTime = 500,
    confirmOverlay,
    loadingOverlay,
    successOverlay,
    errorOverlay,
    onData,
    onSuccess,
    onError
  }: CRUDInput<TI, TO, TStart>) => {
    const pending = ref(false)
    const loading = ref(false)
    const success = ref(false)
    const error = ref<Error | null>(null)
    const refreshing = ref(false)
    const requestTime = ref(0)
    const data = ref(initialData) as Ref<TO>

    let responseTime = 0
    let loadingTimer: ReturnType<typeof setTimeout>
    const getRequestOptions = (startParam?: TStart) => ({
      url,
      params: typeof params === 'function' ? params(startParam) : params,
      method,
      contentType,
      // todo
      headers: mergeHeaders(baseHeaders, headers, contentType),
      timeout,
      responseType
    })

    const run = (param?: TStart) => {
      pending.value = true
      clearTimeout(loadingTimer)
      loadingTimer = setTimeout(() => {
        loading.value = true
        if (loadingOverlay) {
          overlayInstance?.loadingOpen?.(
            transformLoadingOptions<TStart>(loadingOverlay, param)
          )
        }
      }, loadingDelay)

      if (cache?.instance) {
        // todo
        console.log('cache')
      }

      let requestApi
      if (api) {
        requestApi = Array.isArray(api) ? Promise.all(api) : api
      } else {
        requestApi = request(getRequestOptions(param))
      }

      requestTime.value++
      requestApi
        .then((res: unknown) => {
          responseTime++
          if (responseTime !== requestTime.value) return
          if (onData) {
            onData(data, res as TO)
          } else {
            data.value = res as TO
          }
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
          responseTime++
          if (responseTime !== requestTime.value) return
          error.value = err
          onError?.(err)
          if (errorOverlay) {
            overlayInstance?.error?.(
              transformErrorOptions<TStart>(errorOverlay, param, err)
            )
          }
          errorReport?.(err)
        })
        .finally(() => {
          if (responseTime !== requestTime.value) return
          pending.value = false
          loading.value = false
          refreshing.value = false
          clearTimeout(loadingTimer)
          if (loadingOverlay) {
            overlayInstance?.loadingClose?.()
          }
        })
    }

    const debounceHandle = () => {
      if (!pending.value && debounceMode === 'firstOnly') {
        return run
      }
      if (debounceMode === 'lastOnly') {
        return debounce(run, debounceTime)
      }
      if (debounceMode === 'none') return run
    }

    let initialParam: TStart
    const refresh = () => {
      requestTime.value = 0
      refreshing.value = true
      debounceHandle()?.(initialParam)
    }

    const start = (param?: TStart) => {
      if (requestTime.value === 0 && param) {
        initialParam = param
      }
      if (confirmOverlay) {
        overlayInstance
          ?.confirm?.(transformConfirmOptions<TStart>(confirmOverlay, param))
          .then(() => {
            debounceHandle()?.(param)
          })
      } else {
        debounceHandle()?.(param)
      }
    }

    if (immediate) start()

    return {
      pending,
      loading,
      success,
      error,
      refreshing,
      requestTime,
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
