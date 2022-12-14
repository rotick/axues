import type { AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios'
import type { Ref, VNodeChild, ComputedRef } from 'vue'

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
  callback?: (act?: any) => void
}
export interface OverlayImplement {
  loadingOpen?: (options: LoadingOverlayType) => void
  loadingClose?: () => void
  success?: (options: SuccessOrErrorOverlayType) => void
  error?: (options: SuccessOrErrorOverlayType) => void
  confirm?: (options: ConfirmOverlayType) => Promise<unknown>
}

export interface CreateCRUDOptions {
  requestConfig?: () => AxiosRequestConfig
  responseHandle?: (response: unknown) => unknown
  cacheInstance?: CacheInstance
  errorReport?: (err: Error) => void
  loadingDelay?: number
  overlayImplement?: OverlayImplement
}
export type ContentType = 'urlEncode' | 'json' | 'formData' | string
export type Headers<TStart = any> = RawAxiosRequestHeaders | ((param?: TStart) => RawAxiosRequestHeaders)

export interface RequestOptions<T, TStart = any> extends Omit<AxiosRequestConfig, 'url' | 'headers'> {
  url?: string | ((param?: TStart) => string)
  params?: any | ((param?: TStart) => any)
  // WTF https://github.com/microsoft/TypeScript/issues/37663
  data?: T extends any ? T | ((param?: TStart) => T) : never
  contentType?: ContentType
  headers?: Headers<TStart>
}

export type ConfirmOverlayOptions<T> = string | ((param?: T) => VNodeChild) | ConfirmOverlayType
export type LoadingOverlayOptions<T> = boolean | string | ((param?: T) => VNodeChild) | LoadingOverlayType
export type SuccessOverlayOptions<TStart, TO> = string | ((param?: TStart, data?: TO) => VNodeChild) | SuccessOrErrorOverlayType
export type ErrorOverlayOptions<T> = string | ((param?: T, err?: Error) => VNodeChild) | SuccessOrErrorOverlayType

export interface CRUDInput<TI = any, TO = any, TStart = any> extends RequestOptions<TI, TStart> {
  /*
   * request(s) promise function
   * */
  api?: (param?: TStart) => Promise<TO> | Array<Promise<unknown>>
  /*
   * if start when create
   * default: false
   * */
  immediate?: boolean
  /*
   * will set to data before request response
   * default: null
   * */
  initialData?: TO
  /*
   * only accept first or last time
   * default: firstOnly
   * */
  debounceMode?: 'firstOnly' | 'lastOnly' | 'none'
  /*
   * only effect when debounceMode is lastOnly
   * default: 500
   * */
  debounceTime?: number
  /*
   * how many times auto retry
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
  cacheKey?: string | ((param?: TStart) => string)
  /*
   * store the data and payload when vue component is destroyed
   * and restore it when recreate
   * this feature can replace keep-alive
   * default: false
   * */
  // storeDataOnDestroy?: boolean | {
  //   storeData: boolean | (() => boolean)
  //   storage?: 'memory' | 'sessionStorage' | 'localStorage'
  //   payload?: () => JSON
  //   onPayloadRestore?: (payload: JSON) => void
  // } // todo is this a good idea?
  confirmOverlay?: ConfirmOverlayOptions<TStart>
  loadingOverlay?: LoadingOverlayOptions<TStart>
  successOverlay?: SuccessOverlayOptions<TStart, TO>
  errorOverlay?: ErrorOverlayOptions<TStart>
  onData?: (data: Ref<TO>, newData: unknown | unknown[]) => void
  onSuccess?: (data: TO) => void
  onError?: (e: Error) => void
}
export interface CRUDOutput<T, TStart = any> {
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
  start: (param?: TStart) => void
  retry: () => void
  refresh: () => void
  abort: () => void
  deleteCache: (param?: TStart) => void
}

export type RequestType = <TI, TO>(options: RequestOptions<TI>) => Promise<TO>
export type CRUDType = <TI, TO, TStart>(options: CRUDInput<TI, TO, TStart>) => CRUDOutput<TO, TStart>
export interface Provider {
  request: RequestType
  overlayImplement: (options: OverlayImplement) => void
  CRUD: CRUDType
}
