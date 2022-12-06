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
import type { App, Ref, InjectionKey } from 'vue'
import type { AxiosResponse } from 'axios'
import type {
  CreateCRUDOptions,
  OverlayImplement,
  Provider,
  CRUDInput,
  CRUDOutput,
  RequestType
} from './types'

export const key = Symbol('') as InjectionKey<Provider>

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
  const request: RequestType = ({
    url = '',
    params = {},
    method = 'get',
    contentType = '',
    headers,
    timeout,
    responseType = 'json'
  }) => {
    return new Promise((resolve, reject) => {
      axios({
        baseURL,
        url,
        data: transformParams(params as Record<any, any>, contentType),
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
    autoRetryTimes = 0,
    autoRetryInterval = 2,
    cacheKey,
    confirmOverlay,
    loadingOverlay,
    successOverlay,
    errorOverlay,
    onData,
    onSuccess,
    onError
  }: CRUDInput<TI, TO, TStart>): CRUDOutput<TO, TStart> => {
    const pending = ref(false)
    const loading = ref(false)
    const success = ref(false)
    const error = ref<Error | null>(null)
    const refreshing = ref(false)
    const requestTimes = ref(0)
    const retryTimes = ref(0)
    const retrying = ref(false)
    const retryCountdown = ref(0)
    const data = ref(initialData) as Ref<TO>

    let responseTimes = 0
    let loadingTimer: ReturnType<typeof setTimeout>
    let retryTimer: ReturnType<typeof setInterval>

    const run = (param?: TStart) => {
      pending.value = true
      clearTimeout(loadingTimer)
      clearInterval(retryTimer)
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
        retryTimes.value = 0
        success.value = true
        error.value = null
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
        retrying.value = false
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
          if (autoRetryTimes > 0 && retryTimes.value < autoRetryTimes) {
            retryTimes.value++
            const retryTimeout = retryTimes.value * autoRetryInterval
            retryCountdown.value =
              retryTimeout > 30 ? 30 : retryTimeout < 1 ? 1 : retryTimeout
            retryTimer = setInterval(() => {
              retryCountdown.value--
              if (retryCountdown.value === 0) {
                clearInterval(retryTimer)
                retrying.value = true
                run(param)
              }
            }, 1000)
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
    let lastParam: TStart
    const refresh = () => {
      if (refreshing.value) return
      // keep state when refresh
      // data.value = initialData
      requestTimes.value = 0
      responseTimes = 0
      retryTimes.value = 0
      refreshing.value = true
      debounceHandle()?.(initialParam)
    }

    const retry = () => {
      if (retrying.value) return
      if (
        (autoRetryTimes > 0 && retryTimes.value >= autoRetryTimes) ||
        autoRetryTimes === 0
      ) {
        retryTimes.value++
      }
      retrying.value = true
      debounceHandle()?.(lastParam)
    }

    const start = (param?: TStart) => {
      if (param) {
        if (requestTimes.value === 0) {
          initialParam = param
        }
        lastParam = param
      }
      retryTimes.value = 0
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
      retrying,
      retryTimes,
      retryCountdown,
      requestTimes,
      data,
      start,
      refresh,
      retry,
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
