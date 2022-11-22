import type { Method, ResponseType } from 'axios'
import type { Ref, VNodeChild } from 'vue'

interface CacheInsMethods {
  get: (key: string) => unknown
  set: (key: string, value: unknown) => void
}
// interface LoadingInstance {
//   open: (payload: boolean | string | Record<string, any>) => void
//   close: () => void
// }
export interface CreateCRUDOptions {
  baseURL?: string
  headers?: Record<string, string | number | boolean>
  timeout?: number
  responseHandle?: (response: any) => unknown
  cache?: {
    instance: CacheInsMethods
    keySuffix: string
    canCache: (data: any) => boolean
  }
  overlayImplement?: any // todo
  errorReport?: (err: Error) => void
}
export type MethodType = (Method & ('cache' | 'CACHE')) | string
export type ContentType = 'form' | 'json' | 'file' | string

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
}

export interface RequestOptions<T, TStart = any> {
  url: string
  params?: T | ((param?: TStart) => T)
  method: MethodType
  contentType: ContentType
  headers?: Record<string, string | number | boolean>
  timeout?: number
  responseType?: ResponseType
  // axiosConfig?: AxiosRequestConfig // todo do we need this?
}

export interface CRUDInput<TI, TO, TStart = any>
  extends RequestOptions<TI, TStart> {
  promise?: Promise<TO> | Array<Promise<unknown>>
  /*
   * if start when create
   * default: false
   * */
  immediate?: boolean
  /*
   * accept first or last
   * default: first
   * */
  debounce?: 'first' | 'last'
  initialData?: TO
  confirmOverlay?:
  | string
  | ((param?: TStart) => VNodeChild)
  | ConfirmOverlayType
  loadingOverlay?:
  | boolean
  | string
  | ((param: TStart) => VNodeChild)
  | LoadingOverlayType
  successOverlay?:
  | string
  | ((param: TStart, data: TO) => VNodeChild)
  | SuccessOrErrorOverlayType
  errorOverlay?:
  | string
  | ((param: TStart, err: Error) => VNodeChild)
  | SuccessOrErrorOverlayType
  onData?: (data: Ref<TO>, newData: unknown | unknown[]) => void
  onSuccess?: (data: TO) => void
  onError?: (e: Error) => void
}
export interface CRUDOutput<T, TStart = any> {
  loading: boolean
  success: boolean
  error: Error | null
  refreshing: boolean
  // noData: boolean
  // permissionDenied: boolean
  data: T
  start: (param: TStart) => void
  refresh: (param: TStart) => void
}
export type IO = (i: CRUDInput<any, any>) => CRUDOutput<any, any>
