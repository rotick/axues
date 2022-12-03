import { ref } from 'vue'
import axios from 'axios'
import {
  getCacheKey,
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
    // todo any type
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
    maxRetryTimes = 0,
    retryInterval = 500,
    cacheKey,
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
    const requestTimes = ref(0)
    const data = ref(initialData) as Ref<TO>

    let responseTimes = 0
    let loadingTimer: ReturnType<typeof setTimeout>

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

      const successLogic = (res: TO) => {
        if (onData) {
          onData(data, res)
        } else {
          data.value = res
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
      }

      const finallyLogic = () => {
        pending.value = false
        loading.value = false
        refreshing.value = false
        clearTimeout(loadingTimer)
        if (loadingOverlay) {
          overlayInstance?.loadingClose?.()
        }
      }

      const realCacheKey = getCacheKey<TStart>(cacheKey, param)
      if (realCacheKey && cache?.get(realCacheKey)) {
        successLogic(cache.get(realCacheKey) as TO)
        finallyLogic()
        return
      }

      let requestApi
      if (api) {
        requestApi = Array.isArray(api) ? Promise.all(api) : api
      } else {
        requestApi = request({
          url,
          params: typeof params === 'function' ? params(param) : params,
          method,
          contentType,
          headers,
          timeout,
          responseType
        })
      }

      requestTimes.value++
      requestApi
        .then((res: unknown) => {
          // only accept last response
          responseTimes++
          if (responseTimes !== requestTimes.value) return
          successLogic(res as TO)
          realCacheKey && cache?.set(realCacheKey, res)
        })
        .catch((err: Error) => {
          responseTimes++
          if (responseTimes !== requestTimes.value) return
          error.value = err
          onError?.(err)
          if (errorOverlay) {
            overlayInstance?.error?.(
              transformErrorOptions<TStart>(errorOverlay, param, err)
            )
          }
          errorReport?.(err) // todo report more info
        })
        .finally(() => {
          if (responseTimes === requestTimes.value) finallyLogic()
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
      data.value = initialData
      requestTimes.value = 0
      refreshing.value = true
      debounceHandle()?.(initialParam)
    }

    const start = (param?: TStart) => {
      if (requestTimes.value === 0 && param) {
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

    const deleteCache = (param?: TStart) => {
      const realCacheKey = getCacheKey<TStart>(cacheKey, param)
      realCacheKey && cache?.delete(realCacheKey)
    }

    if (immediate) start()

    return {
      pending,
      loading,
      success,
      error,
      refreshing,
      requestTimes,
      data,
      start,
      refresh,
      deleteCache
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
