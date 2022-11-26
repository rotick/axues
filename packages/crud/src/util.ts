import type { ContentType, Headers } from './types'
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
