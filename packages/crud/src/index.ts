import { inject } from 'vue'
import { key } from './create'
import { UseAxuesOptions, OverlayImplement, Provider } from './types'

export { axues, createAxues } from './create'

export function useAxues<TI extends object, TO extends object, TAction = any> (options: UseAxuesOptions<TI, TO, TAction>) {
  const { useFn } = inject(key) as Provider
  return useFn<TI, TO, TAction>(options)
}

export function useOverlayImplement (options: OverlayImplement) {
  const { overlayImplement } = inject(key) as Provider
  return overlayImplement(options)
}
