import { ConfirmOverlayOptions, ConfirmOverlayType, ContentType, ErrorOverlayOptions, Headers, LoadingOverlayOptions, LoadingOverlayType, SuccessOrErrorOverlayType, SuccessOverlayOptions } from './types'

export function resolveRequestOptions (options: any, param?: any) {
  const excludeKeys = [
    'api',
    'immediate',
    'initialData',
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
    url: typeof options.url === 'function' ? options.url(param) : options.url,
    params: typeof options.params === 'function' ? options.params() : options.params,
    data: typeof options.data === 'function' ? options.data() : options.data,
    headers: typeof options.headers === 'function' ? options.headers() : options.headers
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

export function transformData (data: Record<string, any>, contentType?: ContentType) {
  return transformContentType(contentType) === 'application/x-www-form-urlencoded' ? new URLSearchParams(data) : data
}

export function mergeHeaders (header1?: Headers, header2?: Headers, contentType?: ContentType) {
  const ctObj: any = {}
  if (transformContentType(contentType)) {
    ctObj['Content-Type'] = transformContentType(contentType)
  }
  return {
    ...(typeof header1 === 'function' ? header1() : header1 || {}),
    ...(typeof header2 === 'function' ? header2() : header2 || {}),
    ...ctObj
  }
}

export function transformConfirmOptions<T> (options: ConfirmOverlayOptions<T>, param?: T): ConfirmOverlayType {
  let opt: ConfirmOverlayType = {
    style: 1,
    title: '',
    content: '',
    requireInputContent: false
  }
  if (typeof options === 'string') {
    opt.title = options
  } else if (typeof options === 'function') {
    opt = options(param)
  } else {
    opt = options
  }

  return opt
}

export function transformLoadingOptions<T> (options: LoadingOverlayOptions<T>, param?: T): LoadingOverlayType {
  let opt: LoadingOverlayType = {
    style: 1,
    text: ''
  }
  if (typeof options === 'boolean') {
    opt.text = ''
  } else if (typeof options === 'string') {
    opt.text = options
  } else if (typeof options === 'function') {
    opt = options(param)
  } else {
    opt = options
  }

  return opt
}

export function transformSuccessOptions<TAction, TO> (options: SuccessOverlayOptions<TAction, TO>, param?: TAction, data?: TO): SuccessOrErrorOverlayType {
  let opt: SuccessOrErrorOverlayType = {
    style: 1,
    title: '',
    content: '',
    callback: undefined
  }
  if (typeof options === 'string') {
    opt.title = options
  } else if (typeof options === 'function') {
    opt = options(param, data)
  } else {
    opt = options
  }

  return opt
}

export function transformErrorOptions<TAction> (options: ErrorOverlayOptions<TAction>, param?: TAction, err?: Error): SuccessOrErrorOverlayType {
  let opt: SuccessOrErrorOverlayType = {
    style: 1,
    title: '',
    content: '',
    callback: undefined
  }
  if (typeof options === 'string') {
    opt.title = options
  } else if (typeof options === 'function') {
    opt = options(param, err)
  } else {
    opt = options
  }

  return opt
}

export function getCacheKey<T> (cacheKey?: string | ((param?: T) => string), param?: T) {
  return typeof cacheKey === 'function' ? cacheKey(param) : cacheKey
}
