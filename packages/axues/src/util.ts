import { ConfirmOverlayOptions, ConfirmOverlayType, ContentType, ErrorOverlayOptions, Headers, LoadingOverlayOptions, LoadingOverlayType, MaybeComputedOrActionRef, SuccessOrErrorOverlayType, SuccessOverlayOptions } from './types'
import { ref } from 'vue'
import type { Ref } from 'vue'

export function resolveComputedOrActionRef<T, TAction = any> (input: MaybeComputedOrActionRef<T>, actionPayload?: TAction): Ref<T> {
  const resolved = input instanceof Function ? input(actionPayload) : input
  return ref(resolved) as Ref<T>
}
export function resolveRequestOptions (options: any, actionPayload?: any) {
  const excludeKeys = [
    'api',
    'immediate',
    'initialData',
    'shallow',
    'debounceMode',
    'debounceTime',
    'autoRetryTimes',
    'autoRetryInterval',
    'cacheKey',
    'confirmOverlay',
    'loadingOverlay',
    'successOverlay',
    'errorOverlay',
    'onData',
    'onSuccess',
    'onError'
  ]
  const validOptions: any = {}
  Object.keys(options)
    .filter(k => !excludeKeys.includes(k))
    .forEach(key => {
      validOptions[key] = options[key]
    })
  return {
    ...validOptions,
    url: resolveComputedOrActionRef(options.url, actionPayload),
    params: resolveComputedOrActionRef(options.params, actionPayload),
    data: resolveComputedOrActionRef(options.data, actionPayload),
    contentType: resolveComputedOrActionRef(options.contentType, actionPayload),
    headers: resolveComputedOrActionRef(options.headers, actionPayload)
  }
}

function transformContentType (ct?: ContentType) {
  const map = {
    urlEncode: 'application/x-www-form-urlencoded',
    json: 'application/json',
    formData: 'multipart/form-data'
  }
  return map[ct as keyof typeof map] || ct
}

export function transformData (data: MaybeComputedOrActionRef<any>, contentType?: MaybeComputedOrActionRef<ContentType>) {
  const dt = resolveComputedOrActionRef(data)
  const ct = resolveComputedOrActionRef(contentType)
  return transformContentType(ct.value) === 'application/x-www-form-urlencoded' ? new URLSearchParams(dt.value) : data.value
}

export function mergeHeaders (header1?: Headers, header2?: MaybeComputedOrActionRef<any>, contentType?: MaybeComputedOrActionRef<ContentType>) {
  const ctObj: any = {}
  const ct = resolveComputedOrActionRef(contentType)
  if (transformContentType(ct.value)) {
    ctObj['Content-Type'] = transformContentType(ct.value)
  }
  return {
    ...(typeof header1 === 'function' ? header1() : header1 || {}),
    ...(header2 ? resolveComputedOrActionRef(header2).value : {}),
    ...ctObj
  }
}

export function transformConfirmOptions<T> (options: ConfirmOverlayOptions<T>, actionPayload?: T): ConfirmOverlayType {
  let opt: ConfirmOverlayType = {
    style: 1,
    title: '',
    content: '',
    requireInputContent: false
  }
  if (typeof options === 'string') {
    opt.title = options
  } else {
    opt = Object.assign(opt, resolveComputedOrActionRef(options, actionPayload).value)
  }

  return opt
}

export function transformLoadingOptions<T> (options: LoadingOverlayOptions<T>, actionPayload?: T): LoadingOverlayType {
  let opt: LoadingOverlayType = {
    style: 1,
    text: ''
  }
  if (typeof options === 'boolean') {
    opt.text = ''
  } else if (typeof options === 'string') {
    opt.text = options
  } else {
    opt = Object.assign(opt, resolveComputedOrActionRef(options, actionPayload).value)
  }

  return opt
}

export function transformSuccessOptions<TAction, TO> (options: SuccessOverlayOptions<TAction, TO>, actionPayload?: TAction, data?: TO): SuccessOrErrorOverlayType {
  let opt: SuccessOrErrorOverlayType = {
    style: 1,
    title: '',
    content: '',
    callback: undefined
  }
  if (typeof options === 'string') {
    opt.title = options
  } else if (typeof options === 'function') {
    opt = Object.assign(opt, options(actionPayload, data))
  } else {
    opt = Object.assign(opt, resolveComputedOrActionRef(options).value)
  }

  return opt
}

export function transformErrorOptions<TAction> (options: ErrorOverlayOptions<TAction>, actionPayload?: TAction, err?: Error): SuccessOrErrorOverlayType {
  let opt: SuccessOrErrorOverlayType = {
    style: 1,
    title: '',
    content: '',
    callback: undefined
  }
  if (typeof options === 'string') {
    opt.title = options
  } else if (typeof options === 'function') {
    opt = Object.assign(opt, options(actionPayload, err))
  } else {
    opt = Object.assign(opt, resolveComputedOrActionRef(options).value)
  }

  return opt
}

export function getCacheKey<T> (cacheKey?: MaybeComputedOrActionRef<string>, param?: T) {
  return resolveComputedOrActionRef(cacheKey, param).value
}
