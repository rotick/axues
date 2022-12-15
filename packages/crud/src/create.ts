import { ref, computed } from 'vue'
import { getCacheKey, mergeHeaders, resolveRequestOptions, transformConfirmOptions, transformErrorOptions, transformLoadingOptions, transformData, transformSuccessOptions } from './util'
import { debounce } from './debounce'
import type { App, Ref, InjectionKey } from 'vue'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { CreateCRUDOptions, OverlayImplement, Provider, CRUDInput, CRUDOutput, RequestType } from './types'

export const key = Symbol('') as InjectionKey<Provider>

export function createCRUD (axiosInstance: AxiosInstance, { requestConfig, responseHandle, cacheInstance, errorReport, loadingDelay = 300, overlayImplement: baseOverlayImplement }: CreateCRUDOptions) {
  const request: RequestType = options => {
    const baseConfig = requestConfig?.() || {}
    const axiosConfig: AxiosRequestConfig = {
      ...baseConfig,
      ...options,
      url: typeof options.url === 'function' ? options.url() : options.url,
      params: typeof options.params === 'function' ? options.params() : options.params,
      data: transformData(options.data as Record<any, any>, options.contentType),
      headers: mergeHeaders(baseConfig?.headers, options.headers, options.contentType)
    }
    return new Promise((resolve, reject) => {
      axiosInstance(axiosConfig)
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

  const CRUD = <TI, TO, TStart>(options: CRUDInput<TI, TO, TStart>): CRUDOutput<TO, TStart> => {
    const {
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
    } = options
    const pending = ref(false)
    const loading = ref(false)
    const success = ref(false)
    const error = ref<Error | null>(null)
    const refreshing = ref(false)
    const requestTimes = ref(0)
    const retryTimes = ref(0)
    const retrying = ref(false)
    const retryCountdown = ref(0)
    const supportAbort = typeof AbortController === 'function'
    const aborted = ref(false)
    const data = ref(initialData) as Ref<TO>
    const canAbort = computed(() => supportAbort && pending.value)

    let responseTimes = 0
    let loadingTimer: ReturnType<typeof setTimeout>
    let retryTimer: ReturnType<typeof setInterval>
    let ac: AbortController | undefined

    if (supportAbort && !api) {
      ac = new AbortController()
      ac.signal.onabort = () => (aborted.value = true)
    }

    const run = (param?: TStart) => {
      pending.value = true
      aborted.value = false
      clearTimeout(loadingTimer)
      clearInterval(retryTimer)
      loadingTimer = setTimeout(() => {
        loading.value = true
        if (loadingOverlay) {
          overlayInstance?.loadingOpen?.(transformLoadingOptions<TStart>(loadingOverlay, param))
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
          overlayInstance?.success?.(transformSuccessOptions<TStart, TO>(successOverlay, param, data.value))
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
      if (realCacheKey && cacheInstance?.get(realCacheKey)) {
        successLogic(cacheInstance.get(realCacheKey) as TO)
        finallyLogic()
        return
      }

      let requestApi
      if (api) {
        const promise = typeof api === 'function' ? api(param) : api
        requestApi = Array.isArray(promise) ? Promise.all(promise) : promise
      } else {
        let requestOptions = resolveRequestOptions(options, param)
        if (ac) {
          requestOptions = {
            ...requestOptions,
            signal: ac.signal
          }
        }
        requestApi = request(requestOptions)
      }

      requestTimes.value++
      requestApi
        .then((res: unknown) => {
          // only accept last response
          responseTimes++
          if (responseTimes !== requestTimes.value) return
          successLogic(res as TO)
          realCacheKey && cacheInstance?.set(realCacheKey, res)
        })
        .catch((err: Error) => {
          responseTimes++
          if (responseTimes !== requestTimes.value) return
          error.value = err
          onError?.(err)
          if (errorOverlay) {
            overlayInstance?.error?.(transformErrorOptions<TStart>(errorOverlay, param, err))
          }
          if (autoRetryTimes > 0 && retryTimes.value < autoRetryTimes) {
            retryTimes.value++
            const retryTimeout = retryTimes.value * autoRetryInterval
            retryCountdown.value = retryTimeout > 30 ? 30 : retryTimeout < 1 ? 1 : retryTimeout
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
      if ((autoRetryTimes > 0 && retryTimes.value >= autoRetryTimes) || autoRetryTimes === 0) {
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
        overlayInstance?.confirm?.(transformConfirmOptions<TStart>(confirmOverlay, param)).then(() => {
          debounceHandle()?.(param)
        })
      } else {
        debounceHandle()?.(param)
      }
    }

    const abort = () => {
      ac?.abort()
    }

    const deleteCache = (param?: TStart) => {
      const realCacheKey = getCacheKey<TStart>(cacheKey, param)
      realCacheKey && cacheInstance?.delete(realCacheKey)
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
      canAbort,
      aborted,
      data,
      start,
      refresh,
      retry,
      abort,
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
