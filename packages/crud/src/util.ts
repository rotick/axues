import {
  ConfirmOverlayOptions,
  ConfirmOverlayType,
  ContentType,
  Headers,
  LoadingOverlayOptions,
  LoadingOverlayType
} from './types'

function transformContentType (ct: ContentType) {
  const map = {
    urlEncode: 'application/x-www-form-urlencoded',
    json: 'application/json',
    formData: 'multipart/form-data'
  }
  return map[ct as keyof typeof map] || ct
}

export function transformParams (
  params: Record<string, any>,
  contentType: ContentType
) {
  return contentType === 'application/x-www-form-urlencoded'
    ? new URLSearchParams(params as URLSearchParams)
    : params
}

export function mergeHeaders (
  header1?: Headers,
  header2?: Headers,
  contentType?: ContentType
) {
  return {
    ...(typeof header1 === 'function' ? header1() : header1 || {}),
    ...(typeof header2 === 'function' ? header2() : header2 || {}),
    'Content-Type': transformContentType(contentType || 'urlEncode')
  }
}

export function transformConfirmOptions<T> (
  options: ConfirmOverlayOptions<T>,
  param?: T
): ConfirmOverlayType {
  let opt: ConfirmOverlayType = {
    style: 1,
    title: '',
    content: '',
    requireInputContent: false
  }
  if (typeof options === 'string') {
    opt.title = options
  } else if (typeof options === 'function') {
    opt.title = () => options(param)
  } else {
    opt = options
  }

  return opt
}

export function transformLoadingOptions<T> (
  options: LoadingOverlayOptions<T>,
  param?: T
): LoadingOverlayType {
  let opt: LoadingOverlayType = {
    style: 1,
    text: ''
  }
  if (typeof options === 'boolean') {
    opt.text = ''
  } else if (typeof options === 'string') {
    opt.text = options
  } else if (typeof options === 'function') {
    opt.text = () => options(param)
  } else {
    opt = options
  }

  return opt
}
