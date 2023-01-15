import type { AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios'
import type { Ref, VNodeChild, ComputedRef } from 'vue'

export type MaybeRef<T> = T | Ref<T>
export type MaybeComputedRef<T> = ComputedRef<T> | MaybeRef<T>
export type MaybeComputedOrActionRef<T, TAction = any> = MaybeComputedRef<T> | ((actionPayload?: TAction) => T)
interface CacheInstance {
  get: (key: string) => unknown
  set: (key: string, value: unknown) => void
  delete: (key: string) => void
}
// overlay UI types
export interface ConfirmOverlayType {
  style?: number
  title: string | (() => VNodeChild)
  content?: string | (() => VNodeChild)
  requireInputContent?: boolean
}
export interface LoadingOverlayType {
  style?: number
  text?: string | (() => VNodeChild)
}
export interface SuccessOrErrorOverlayType {
  style?: number
  title: string | (() => VNodeChild)
  content?: string | (() => VNodeChild)
  callback?: (payload?: any) => void
}
export interface OverlayImplement {
  loadingOpen?: (options: LoadingOverlayType) => void
  loadingClose?: () => void
  success?: (options: SuccessOrErrorOverlayType) => void
  error?: (options: SuccessOrErrorOverlayType) => void
  confirm?: (options: ConfirmOverlayType) => Promise<unknown>
}

export type ConfirmOverlayOptions<T> = MaybeComputedOrActionRef<string | ConfirmOverlayType, T>
export type LoadingOverlayOptions<T> = MaybeComputedOrActionRef<boolean | string | LoadingOverlayType, T>
export type SuccessOverlayOptions<TAction, TO> = MaybeComputedRef<string | SuccessOrErrorOverlayType> | ((actionPayload?: TAction, data?: TO) => string | SuccessOrErrorOverlayType)
export type ErrorOverlayOptions<T> = MaybeComputedRef<string | SuccessOrErrorOverlayType> | ((actionPayload?: T, err?: Error) => string | SuccessOrErrorOverlayType)

export interface Axues {
  <TI = any, TO = any>(config: AxuesRequestConfig<TI>): Promise<TO>
  request?: <TI = any, TO = any>(config: AxuesRequestConfig<TI>) => Promise<TO>
  get?: <TI = any, TO = any>(url: string, config?: AxuesRequestConfig<TI>) => Promise<TO>
  delete?: <TI = any, TO = any>(url: string, config?: AxuesRequestConfig<TI>) => Promise<TO>
  head?: <TI = any, TO = any>(url: string, config?: AxuesRequestConfig<TI>) => Promise<TO>
  options?: <TI = any, TO = any>(url: string, config?: AxuesRequestConfig<TI>) => Promise<TO>
  post?: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
  put?: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
  patch?: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
  postForm?: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
  putForm?: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
  patchForm?: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
}
export interface CreateAxuesOptions {
  requestConfig?: () => AxiosRequestConfig
  responseHandle?: (response: unknown) => unknown
  errorHandle?: (err: Error) => Error
  cacheInstance?: CacheInstance
  errorReport?: (err: Error) => void
  loadingDelay?: number
  overlayImplement?: OverlayImplement
}
export type ContentType = 'urlEncode' | 'json' | 'formData' | string
export type Headers<TAction = any> = RawAxiosRequestHeaders | ((actionPayload?: TAction) => RawAxiosRequestHeaders)

export interface AxuesRequestConfig<TI = any, TAction = any> extends Omit<AxiosRequestConfig, 'url' | 'headers'> {
  url?: MaybeComputedOrActionRef<string, TAction>
  params?: MaybeComputedOrActionRef<TI, TAction>
  data?: MaybeComputedOrActionRef<TI, TAction>
  contentType?: MaybeComputedOrActionRef<ContentType, TAction>
  headers?: MaybeComputedOrActionRef<RawAxiosRequestHeaders, TAction>
}

export type DebounceMode = 'firstPass' | 'lastPass' | 'none'

export interface UseAxuesOptions<TI = any, TO = any, TAction = any> extends AxuesRequestConfig<TI, TAction> {
  /*
   * any promise function
   * */
  promise?: (actionPayload?: TAction, signal?: AbortSignal) => Promise<TO>
  /*
   * if start when create
   * default: false
   * */
  immediate?: boolean
  /*
   * will set to data before axios response
   * default: null
   * */
  initialData?: TO
  /*
   * use shallowRef wrap the data?
   * default: false
   * */
  shallow?: boolean
  /*
   * only accept first or last call to action
   * default: firstPass
   * */
  debounceMode?: DebounceMode
  /*
   * only effect when debounceMode is lastPass
   * default: 500 (ms)
   * */
  debounceTime?: number
  /*
   * auto retry several times
   * default: 0
   * */
  autoRetryTimes?: number
  /*
   * unit: second
   * default: 2
   * */
  autoRetryInterval?: number
  /*
   * when set cacheKey, the response will be cached
   * default: undefined
   * */
  cacheKey?: MaybeComputedOrActionRef<string, TAction>
  /*
   * inspired by https://github.com/vueuse/vueuse/issues/611
   * whether the action method should throw error when an error occurs
   * also effect on refresh, retry, get, post, put...
   * default: false
   * */
  throwOnActionFailed?: boolean
  /*
   * fullscreen overlay components, such as loading, toast, modal
   * must be implement the component in createAxues or useOverlayImplement
   * */
  confirmOverlay?: ConfirmOverlayOptions<TAction>
  loadingOverlay?: LoadingOverlayOptions<TAction>
  successOverlay?: SuccessOverlayOptions<TAction, TO>
  errorOverlay?: ErrorOverlayOptions<TAction>
  /*
   * merge data when axios response
   * e.g. data.value.currentPage = newData.current
   * default: data.value = newData
   * */
  onData?: (data: Ref<TO>, newData: unknown | unknown[], actionPayload?: TAction) => void
  onSuccess?: (data: TO, actionPayload?: TAction) => void
  onError?: (err: Error, actionPayload?: TAction) => void
  onFinally?: (actionPayload?: TAction) => void
}
export interface UseAxuesOutput<TI, TO, TAction = any> {
  pending: Ref<boolean>
  loading: Ref<boolean>
  success: Ref<boolean>
  error: Ref<Error | null>
  refreshing: Ref<boolean>
  retrying: Ref<boolean>
  retryTimes: Ref<number>
  retryCountdown: Ref<number>
  requestTimes: Ref<number>
  canAbort: ComputedRef<boolean>
  aborted: Ref<boolean>
  data: Ref<TO>
  action: (actionPayload?: TAction) => PromiseLike<TO>
  retry: () => PromiseLike<TO>
  refresh: () => PromiseLike<TO>
  abort: () => void
  deleteCache: (actionPayload?: TAction) => void
  get: (params?: MaybeComputedOrActionRef<any, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  head: (params?: MaybeComputedOrActionRef<any, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  options: (params?: MaybeComputedOrActionRef<any, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  delete: (params?: MaybeComputedOrActionRef<any, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  post: (data?: MaybeComputedOrActionRef<TI, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  put: (data?: MaybeComputedOrActionRef<TI, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  patch: (data?: MaybeComputedOrActionRef<TI, TAction>, actionPayload?: TAction) => PromiseLike<TO>
}

export interface Provider {
  axuesFn: Axues
  overlayImplement: (options: OverlayImplement) => void
  useFn: <TI, TO, TAction>(options: UseAxuesOptions<TI, TO, TAction>) => UseAxuesOutput<TI, TO, TAction>
}
