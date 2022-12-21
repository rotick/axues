import { ref, computed } from 'vue'
import { getCacheKey, mergeHeaders, resolveRequestOptions, transformConfirmOptions, transformErrorOptions, transformLoadingOptions, transformData, transformSuccessOptions } from './util'
import { debounce } from './debounce'
import type { App, Ref, InjectionKey } from 'vue'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { Axues, CreateAxuesOptions, OverlayImplement, Provider, UseAxuesOptions, UseAxuesOutput } from './types'
import { AxuesRequestConfig } from './types'

export const key = Symbol('') as InjectionKey<Provider>

export let axues: Axues = () => {
  throw new Error('Please create axues instance first')
}

export function createAxues (axiosInstance: AxiosInstance, { requestConfig, responseHandle, cacheInstance, errorReport, loadingDelay = 300, overlayImplement: baseOverlayImplement }: CreateAxuesOptions) {
  const request: Axues = config => {
    const baseConfig = requestConfig?.() || {}
    const axiosConfig: AxiosRequestConfig = {
      ...baseConfig,
      ...config,
      url: typeof config.url === 'function' ? config.url() : config.url,
      params: typeof config.params === 'function' ? config.params() : config.params,
      data: transformData(config.data as Record<any, any>, config.contentType),
      headers: mergeHeaders(baseConfig?.headers, config.headers, config.contentType)
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
  function addAlias (method: string) {
    return <TI = any, TO = any>(url: string, config?: AxuesRequestConfig<TI>) => {
      return request<TI, TO>({
        ...config,
        url,
        method
      })
    }
  }
  function addAliasWithData (method: string, contentType?: string) {
    return <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => {
      return request<TI, TO>({
        ...config,
        url,
        method,
        data,
        contentType
      })
    }
  }

  axues = request
  axues.request = request
  axues.get = addAlias('get')
  axues.delete = addAlias('delete')
  axues.head = addAlias('head')
  axues.options = addAlias('options')
  axues.post = addAliasWithData('post')
  axues.put = addAliasWithData('put')
  axues.patch = addAliasWithData('patch')
  axues.postForm = addAliasWithData('post', 'form')
  axues.putForm = addAliasWithData('put', 'form')
  axues.patchForm = addAliasWithData('patch', 'form')

  let overlayInstance: OverlayImplement | undefined = baseOverlayImplement
  const overlayImplement = (options: OverlayImplement) => {
    overlayInstance = options
  }

  const useFn = <TI, TO, TAction>(options: UseAxuesOptions<TI, TO, TAction>): UseAxuesOutput<TO, TAction> => {
    if (!options) throw new Error('options is required')
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

    const run = (param?: TAction) => {
      pending.value = true
      aborted.value = false
      clearTimeout(loadingTimer)
      clearInterval(retryTimer)
      loadingTimer = setTimeout(() => {
        loading.value = true
        if (loadingOverlay) {
          overlayInstance?.loadingOpen?.(transformLoadingOptions<TAction>(loadingOverlay, param))
        }
      }, loadingDelay)

      const successLogic = (res: TO) => {
        console.log(111)
        if (onData) {
          onData(data, res)
        } else {
          data.value = res
        }
        retryTimes.value = 0
        success.value = true
        error.value = null
        onSuccess?.(res)
        if (successOverlay) {
          overlayInstance?.success?.(transformSuccessOptions<TAction, TO>(successOverlay, param, data.value))
        }
      }

      const finallyLogic = () => {
        console.log(222)
        pending.value = false
        loading.value = false
        refreshing.value = false
        retrying.value = false
        clearTimeout(loadingTimer)
        if (loadingOverlay) {
          overlayInstance?.loadingClose?.()
        }
      }

      const realCacheKey = getCacheKey<TAction>(cacheKey, param)
      if (realCacheKey) {
        const cachedData = cacheInstance?.get(realCacheKey) as string
        if (cachedData) {
          successLogic(JSON.parse(cachedData) as TO)
          finallyLogic()
          return
        }
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
        requestApi = axues(requestOptions)
      }

      requestTimes.value++
      requestApi
        .then((res: unknown) => {
          // only accept last response
          responseTimes++
          if (responseTimes !== requestTimes.value) return
          try {
            successLogic(res as TO)
            if (realCacheKey) {
              if (cacheInstance) {
                cacheInstance.set(realCacheKey, JSON.stringify(res))
              } else {
                console.error('The cacheInstance must be configured in createAxues to use the cache')
              }
            }
          } catch (err) {
            console.error(err)
          }
        })
        .catch((err: Error) => {
          responseTimes++
          if (responseTimes !== requestTimes.value) return
          error.value = err
          onError?.(err)
          if (errorOverlay) {
            overlayInstance?.error?.(transformErrorOptions<TAction>(errorOverlay, param, err))
          }
          if (autoRetryTimes > 0 && retryTimes.value < autoRetryTimes) {
            retryTimes.value++
            const retryTimeout = autoRetryInterval * retryTimes.value + retryTimes.value
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

    let debounceHandle = run
    if (debounceMode === 'lastOnly') {
      // eslint-disable-next-line
      debounceHandle = debounce(run, debounceTime)
    }
    let initialParam: TAction
    let lastParam: TAction
    const refresh = () => {
      if (refreshing.value) return
      // keep state when refresh
      // data.value = initialData
      requestTimes.value = 0
      responseTimes = 0
      retryTimes.value = 0
      refreshing.value = true
      debounceHandle(initialParam)
    }

    const retry = () => {
      if (retrying.value) return
      if ((autoRetryTimes > 0 && retryTimes.value >= autoRetryTimes) || autoRetryTimes === 0) {
        retryTimes.value++
      }
      clearInterval(retryTimer)
      retryCountdown.value = 0
      retrying.value = true
      debounceHandle(lastParam)
    }

    const action = (param?: TAction) => {
      if ((pending.value && debounceMode === 'firstOnly') || retrying.value || refreshing.value || retryCountdown.value > 0) return
      if (param) {
        if (requestTimes.value === 0) {
          initialParam = param
        }
        lastParam = param
      }
      error.value = null
      retryTimes.value = 0
      if (confirmOverlay) {
        overlayInstance?.confirm?.(transformConfirmOptions<TAction>(confirmOverlay, param)).then(() => {
          debounceHandle(param)
        })
      } else {
        debounceHandle(param)
      }
    }

    const abort = () => {
      ac?.abort()
    }

    const deleteCache = (param?: TAction) => {
      const realCacheKey = getCacheKey<TAction>(cacheKey, param)
      realCacheKey && cacheInstance?.delete(realCacheKey)
    }

    if (immediate) action()

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
      action,
      refresh,
      retry,
      abort,
      deleteCache
    }
  }
  interface CreateReturn extends Axues {
    install: (app: App) => void
  }
  const createReturn: CreateReturn = axues as CreateReturn
  createReturn.install = app => {
    app.provide(key, {
      axuesFn: axues,
      overlayImplement,
      useFn
    })
  }
  return createReturn
}
