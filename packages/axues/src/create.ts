import { ref, computed, toRaw, shallowRef } from 'vue'
import { getCacheKey, mergeHeaders, resolveRequestOptions, transformConfirmOptions, transformErrorOptions, transformLoadingOptions, transformData, transformSuccessOptions, resolveComputedOrActionRef, CancelablePromise } from './util'
import { debounce } from './debounce'
import type { App, Ref, InjectionKey } from 'vue'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { Axues, AxuesRequestConfig, CreateAxuesOptions, OverlayImplement, MaybeComputedOrActionRef, Provider, UseAxuesOptions, UseAxuesOutput } from './types'

export const key = Symbol('') as InjectionKey<Provider>

export let axues: Axues = () => {
  throw new Error('Please create axues instance first')
}

function throwErr (err: string | Error) {
  throw typeof err === 'string' ? new Error(err) : err
}

export function createAxues (axiosInstance: AxiosInstance, { requestConfig, responseHandle, errorHandle, cacheInstance, errorReport, loadingDelay = 300, overlayImplement: baseOverlayImplement }: CreateAxuesOptions) {
  const request: Axues = config => {
    const baseConfig = requestConfig?.() || {}
    const axiosConfig: AxiosRequestConfig = {
      ...baseConfig,
      ...config,
      url: resolveComputedOrActionRef(config.url).value,
      params: resolveComputedOrActionRef(config.params).value,
      data: transformData(config.data, config.contentType),
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
        .catch((err: Error) => {
          const handledErr = errorHandle?.(err) || err
          reject(handledErr)
        })
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

  const useFn = <TI, TO, TAction>(options: UseAxuesOptions<TI, TO, TAction>): UseAxuesOutput<TI, TO, TAction> => {
    if (!options) throw new Error('options is required')
    const {
      api,
      immediate = false,
      initialData = null as TO,
      shallow = false,
      debounceMode = 'firstOnly',
      debounceTime = 500,
      autoRetryTimes = 0,
      autoRetryInterval = 2,
      cacheKey,
      throwOnActionFailed = false,
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
    const data = (shallow ? shallowRef(initialData) : ref(initialData)) as Ref<TO>
    const canAbort = computed(() => supportAbort && pending.value)

    let responseTimes = 0
    let loadingTimer: ReturnType<typeof setTimeout>
    let retryTimer: ReturnType<typeof setInterval>
    let ac: AbortController | undefined

    if (supportAbort && !api) {
      ac = new AbortController()
      ac.signal.onabort = () => (aborted.value = true)
    }

    const run = (actionPayload?: TAction) => {
      pending.value = true
      aborted.value = false
      clearTimeout(loadingTimer)
      clearInterval(retryTimer)
      loadingTimer = setTimeout(() => {
        loading.value = true
        if (loadingOverlay) {
          if (overlayInstance?.loadingOpen) {
            overlayInstance.loadingOpen(transformLoadingOptions<TAction>(loadingOverlay, actionPayload))
          } else {
            throwErr('Please implement the loading overlay component before')
          }
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
        onSuccess?.(toRaw(data.value))
        if (successOverlay) {
          if (overlayInstance?.success) {
            overlayInstance.success(transformSuccessOptions<TAction, TO>(successOverlay, actionPayload, toRaw(data.value)))
          } else {
            throwErr('Please implement the success overlay component before')
          }
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

      return new Promise((resolve, reject) => {
        const realCacheKey = getCacheKey<TAction>(cacheKey, actionPayload)
        if (realCacheKey) {
          const cachedData = cacheInstance?.get(realCacheKey) as string
          if (cachedData) {
            const res = JSON.parse(cachedData) as TO
            successLogic(res)
            finallyLogic()
            resolve(res)
            return
          }
        }

        let requestApi: Promise<unknown>
        if (api) {
          // todo signal and rename
          const promise = typeof api === 'function' ? api(actionPayload) : api
          requestApi = Array.isArray(promise) ? Promise.all(promise) : promise
        } else {
          let requestOptions = resolveRequestOptions(options, actionPayload)
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
                  throwErr('The cacheInstance must be configured in createAxues to use the cache')
                }
              }
            } catch (err) {
              throwErr(err as Error)
            }
            resolve(toRaw(data.value))
          })
          .catch((err: Error) => {
            responseTimes++
            if (responseTimes !== requestTimes.value) return
            error.value = err
            onError?.(err)
            if (errorOverlay) {
              if (overlayInstance?.error) {
                overlayInstance.error(transformErrorOptions<TAction>(errorOverlay, actionPayload, err))
              } else {
                throwErr('Please implement the error overlay component before')
              }
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
                  run(actionPayload)
                }
              }, 1000)
            }
            errorReport?.(err) // todo report more info
            reject(err)
          })
          .finally(() => {
            if (responseTimes === requestTimes.value) finallyLogic()
          })
      })
    }

    let debounceHandle = run
    if (debounceMode === 'lastOnly') {
      // eslint-disable-next-line
      debounceHandle = debounce(run, debounceTime)
    }
    let initialPayload: TAction
    let lastPayload: TAction
    const refresh = () => {
      return new CancelablePromise<TO>((resolve, reject, cancel) => {
        if (refreshing.value) return cancel()
        // keep state when refresh
        // data.value = initialData
        retryTimes.value = 0
        requestTimes.value = 0
        responseTimes = 0
        refreshing.value = true
        debounceHandle(initialPayload).then(resolve, err => {
          if (throwOnActionFailed) return reject(err)
          resolve(null)
        })
      })
    }

    const retry = () => {
      return new CancelablePromise<TO>((resolve, reject, cancel) => {
        if (retrying.value) return cancel()
        if (!error.value) {
          throwErr('Retry can only be called on error state')
          return cancel()
        }
        if ((autoRetryTimes > 0 && retryTimes.value >= autoRetryTimes) || autoRetryTimes === 0) {
          retryTimes.value++
        }
        clearInterval(retryTimer)
        retryCountdown.value = 0
        retrying.value = true
        debounceHandle(lastPayload).then(resolve, err => {
          if (throwOnActionFailed) return reject(err)
          resolve(null)
        })
      })
    }

    const action = (actionPayload?: TAction) => {
      return new CancelablePromise<TO>((resolve, reject, cancel) => {
        if ((pending.value && debounceMode === 'firstOnly') || retrying.value || refreshing.value || retryCountdown.value > 0) return cancel()
        if (actionPayload) {
          if (requestTimes.value === 0) {
            initialPayload = actionPayload
          }
          lastPayload = actionPayload
        }
        success.value = false
        error.value = null
        retryTimes.value = 0
        if (confirmOverlay) {
          if (overlayInstance?.confirm) {
            overlayInstance.confirm(transformConfirmOptions<TAction>(confirmOverlay, actionPayload)).then(() => {
              debounceHandle(actionPayload).then(resolve, err => {
                if (throwOnActionFailed) return reject(err)
                resolve(null)
              })
            }, cancel)
          } else {
            throwErr('Please implement the confirm overlay component before')
          }
        } else {
          debounceHandle(actionPayload).then(resolve, err => {
            if (throwOnActionFailed) return reject(err)
            resolve(null)
          })
        }
      })
    }

    const actionAlias = (method: string) => {
      if (['get', 'head', 'options', 'delete'].includes(method)) {
        return (params?: MaybeComputedOrActionRef<any, TAction>, actionPayload?: TAction) => {
          options.params = params
          options.method = method
          return action(actionPayload)
        }
      } else {
        return (data?: MaybeComputedOrActionRef<TI, TAction>, actionPayload?: TAction) => {
          options.data = data
          options.method = method
          return action(actionPayload)
        }
      }
    }

    const abort = () => {
      ac?.abort()
    }

    const deleteCache = (actionPayload?: TAction) => {
      const realCacheKey = getCacheKey<TAction>(cacheKey, actionPayload)
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
      deleteCache,
      get: actionAlias('get'),
      head: actionAlias('head'),
      options: actionAlias('options'),
      delete: actionAlias('delete'),
      post: actionAlias('post'),
      put: actionAlias('put'),
      patch: actionAlias('patch')
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
