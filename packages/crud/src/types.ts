import type { Method, ResponseType } from 'axios'
import type { Ref, VNodeChild } from 'vue'

interface CacheInsMethods {
  get: (key: string) => unknown
  set: (key: string, value: unknown) => void
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
  cache?: {
    // ssr only
    instance: CacheInsMethods
    keySuffix: string
    canCache: (data: any) => boolean
  }
  errorReport?: (err: Error) => void
  loadingDelay?: number
  overlayImplement?: OverlayImplement
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
  // axiosConfig?: AxiosRequestConfig // todo do we need this?
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
   * accept first or last
   * default: first
   * */
  debounce?: 'first' | 'last'
  /*
   * only effect when debounce is last
   * default: 500
   * */
  debounceTime?: number
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
  // noData: boolean
  // permissionDenied: boolean
  data: T
  start: (param?: TStart) => void
  refresh: (param?: TStart) => void
}
export type IO = (i: CRUDInput<any, any, any>) => CRUDOutput<any, any>

export type ImplementOverlay = (options: OverlayImplement) => void
