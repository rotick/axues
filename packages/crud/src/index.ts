import { inject } from 'vue'
import { key } from './create'
import { CRUDInput, OverlayImplement, Provider, RequestOptions } from './types'

export { createCRUD } from './create'

export function useCRUD<TI extends object, TO extends object, TStart = any> (
  options: CRUDInput<TI, TO, TStart>
) {
  const { CRUD } = inject(key) as Provider
  return CRUD<TI, TO, TStart>(options)
}

export function useRequest<TI extends object, TO extends object> (
  options: RequestOptions<TI>
) {
  const { request } = inject(key) as Provider
  return request<TI, TO>(options)
}

export function useOverlayImplement (options: OverlayImplement) {
  const { overlayImplement } = inject(key) as Provider
  return overlayImplement(options)
}
