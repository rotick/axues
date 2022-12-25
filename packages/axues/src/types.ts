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
// todo maybeComputedRef
export type ConfirmOverlayOptions<T> = string | ConfirmOverlayType | ((param?: T) => ConfirmOverlayType)
export type LoadingOverlayOptions<T> = boolean | string | LoadingOverlayType | ((param?: T) => LoadingOverlayType)
export type SuccessOverlayOptions<TAction, TO> = string | SuccessOrErrorOverlayType | ((param?: TAction, data?: TO) => SuccessOrErrorOverlayType)
export type ErrorOverlayOptions<T> = string | SuccessOrErrorOverlayType | ((param?: T, err?: Error) => SuccessOrErrorOverlayType)

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
  // todo
  errorHandle?: (err: Error) => Error
  cacheInstance?: CacheInstance
  errorReport?: (err: Error) => void
  loadingDelay?: number
  overlayImplement?: OverlayImplement
}
export type ContentType = 'urlEncode' | 'json' | 'formData' | string
export type Headers<TAction = any> = RawAxiosRequestHeaders | ((param?: TAction) => RawAxiosRequestHeaders)

export interface AxuesRequestConfig<T = any, TAction = any> extends Omit<AxiosRequestConfig, 'url' | 'headers'> {
  url?: MaybeComputedOrActionRef<string, TAction>
  // follow axios set to any: https://github.com/axios/axios/blob/v1.x/index.d.ts#L293
  params?: MaybeComputedOrActionRef<any, TAction>
  data?: MaybeComputedOrActionRef<T, TAction>
  contentType?: MaybeComputedOrActionRef<ContentType>
  headers?: MaybeComputedOrActionRef<RawAxiosRequestHeaders, TAction>
}

export type DebounceMode = 'firstOnly' | 'lastOnly' | 'none'

export interface UseAxuesOptions<TI = any, TO = any, TAction = any> extends AxuesRequestConfig<TI, TAction> {
  // todo maybeComputedRef
  /*
   * request(s) promise function
   * */
  api?: Promise<TO> | Array<Promise<TO>> | ((param?: TAction) => Promise<TO> | Array<Promise<TO>>)
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
   * only accept first or last time
   * default: firstOnly
   * */
  // todo resolve
  debounceMode?: MaybeComputedOrActionRef<DebounceMode, TAction>
  /*
   * only effect when debounceMode is lastOnly
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
  cacheKey?: string | ((param?: TAction) => string)
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
  onData?: (data: Ref<TO>, newData: unknown | unknown[]) => void
  onSuccess?: (data: TO) => void
  onError?: (e: Error) => void
}
export interface UseAxuesOutput<T, TAction = any> {
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
  data: Ref<T>
  action: (param?: TAction) => void
  retry: () => void
  refresh: () => void
  abort: () => void
  deleteCache: (param?: TAction) => void
  // todo alias method such as get/post
}

export interface Provider {
  axuesFn: Axues
  overlayImplement: (options: OverlayImplement) => void
  useFn: <TI, TO, TAction>(options: UseAxuesOptions<TI, TO, TAction>) => UseAxuesOutput<TO, TAction>
}
