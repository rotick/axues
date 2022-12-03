import type { Method, ResponseType } from 'axios'
import type { Ref, VNodeChild } from 'vue'

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

export type Headers =
  | Record<string, string | number | boolean>
  | (() => Record<string, string | number | boolean>)

export interface CreateCRUDOptions {
  baseURL?: string
  headers?: Headers
  timeout?: number
  responseHandle?: (response: unknown) => unknown
  cache?: CacheInstance
  howToRemember?: 'memory' | 'sessionStorage' | 'localStorage'
  errorReport?: (err: Error) => void
  loadingDelay?: number
  overlayImplement?: OverlayImplement
  optionsValidation?: any // todo validation useCRUD options
}
export type MethodType = (Method & ('cache' | 'CACHE')) | string
export type ContentType = 'urlEncode' | 'json' | 'formData' | string

export interface RequestOptions<T, TStart = any> {
  url?: string
  // WTF https://github.com/microsoft/TypeScript/issues/37663
  params?: T extends any ? T | ((param?: TStart) => T) : never
  method: MethodType
  contentType: ContentType
  headers?: Headers
  timeout?: number
  responseType?: ResponseType
  // axiosConfig?: AxiosRequestConfig // todo do we need this? axios.config maybe better
}

export type ConfirmOverlayOptions<T> =
  | string
  | ((param?: T) => VNodeChild)
  | ConfirmOverlayType
export type LoadingOverlayOptions<T> =
  | boolean
  | string
  | ((param?: T) => VNodeChild)
  | LoadingOverlayType
export type SuccessOverlayOptions<TStart, TO> =
  | string
  | ((param?: TStart, data?: TO) => VNodeChild)
  | SuccessOrErrorOverlayType
export type ErrorOverlayOptions<T> =
  | string
  | ((param?: T, err?: Error) => VNodeChild)
  | SuccessOrErrorOverlayType

export interface CRUDInput<TI, TO, TStart = any>
  extends RequestOptions<TI, TStart> {
  /*
   * request(s) promise function
   * */
  api?: Promise<TO> | Array<Promise<unknown>>
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
  maxRetryTimes?: number // todo
  retryInterval?: number // todo
  throwErrorBeforeRetry?: boolean
  cacheKey?: string | ((param?: TStart) => string)
  // https://router.vuejs.org/zh/guide/advanced/scroll-behavior.html#%E5%BB%B6%E8%BF%9F%E6%BB%9A%E5%8A%A8
  remember?: boolean // todo restore all data when recreate, e.g. pagination list go detail then back
  rememberPayload?: any // todo is this a good idea?
  confirmOverlay?: ConfirmOverlayOptions<TStart>
  loadingOverlay?: LoadingOverlayOptions<TStart>
  successOverlay?: SuccessOverlayOptions<TStart, TO>
  errorOverlay?: ErrorOverlayOptions<TStart>
  onData?: (data: Ref<TO>, newData: unknown | unknown[]) => void
  onSuccess?: (data: TO) => void
  onError?: (e: Error) => void
}
export interface CRUDOutput<T, TStart = any> {
  pending: boolean
  loading: boolean
  success: boolean
  error: Error | null
  refreshing: boolean
  retrying: boolean
  requestTimes: number
  // noData: boolean // todo extend in create
  // permissionDenied: boolean
  data: T
  start: (param?: TStart) => void
  refresh: () => void
  deleteCache: (param?: TStart) => void
}
export type IO = (i: CRUDInput<any, any, any>) => CRUDOutput<any, any>

export type ImplementOverlay = (options: OverlayImplement) => void
