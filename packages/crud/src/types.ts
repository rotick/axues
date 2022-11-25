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
  callback?: (act: any) => void
}
export interface OverlayImplement {
  loadingOpen: (options: LoadingOverlayType) => void
  loadingClose: () => void
  success: (options: SuccessOrErrorOverlayType) => void
  error: (options: SuccessOrErrorOverlayType, err: Error) => void
  confirm: (options: ConfirmOverlayType) => Promise<boolean>
}

export interface CreateCRUDOptions {
  baseURL?: string
  headers?:
  | Record<string, string | number | boolean>
  | (() => Record<string, string | number | boolean>)
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
  debounceTime?: number
  overlayImplement?: OverlayImplement
}
export type MethodType = (Method & ('cache' | 'CACHE')) | string
export type ContentType = 'formUrlEncode' | 'json' | 'formData' | string

export interface RequestOptions<T, TStart = any> {
  url: string
  params?: T | ((param?: TStart) => T)
  method: MethodType
  contentType: ContentType
  headers?:
  | Record<string, string | number | boolean>
  | ((param?: TStart) => Record<string, string | number | boolean>)
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
  debounceTime?: number
  initialData?: TO
  // toRef?: boolean
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
  pending: boolean
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
export type IO = (i: CRUDInput<any, any, any>) => CRUDOutput<any, any>

export type ImplementOverlay = (options: OverlayImplement) => void
