import { inject } from 'vue'
import { key } from './create'
import { UseAxuesOptions, OverlayImplement, Provider, RequestOptions } from './types'

export { createAxues } from './create'

export function useAxues<TI extends object, TO extends object, TStart = any> (options: UseAxuesOptions<TI, TO, TStart>) {
  const { useFn } = inject(key) as Provider
  return useFn<TI, TO, TStart>(options)
}

export function useRequest<TI extends object, TO extends object> (options: RequestOptions<TI>) {
  const { request } = inject(key) as Provider
  return request<TI, TO>(options)
}

export function useOverlayImplement (options: OverlayImplement) {
  const { overlayImplement } = inject(key) as Provider
  return overlayImplement(options)
}
