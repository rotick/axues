import { inject, isRef } from 'vue'
import { key } from './create'
import { UseAxuesOptions, OverlayImplement, Provider, MaybeComputedOrActionRef } from './types'

export { axues, createAxues } from './create'

export function useAxues<TI = any, TO = any, TAction = any> (urlOrOptions: MaybeComputedOrActionRef<string> | UseAxuesOptions<TI, TO, TAction>, options?: UseAxuesOptions<TI, TO, TAction>) {
  const { useFn } = inject(key) as Provider
  // todo how to make promise as first argument
  const optionsIsUrl = typeof urlOrOptions === 'string' || typeof urlOrOptions === 'function' || isRef(urlOrOptions)
  let useOptions: UseAxuesOptions<TI, TO, TAction>
  if (optionsIsUrl) {
    useOptions = {
      ...(options || {}),
      url: urlOrOptions
    }
  } else {
    useOptions = urlOrOptions
  }
  return useFn<TI, TO, TAction>(useOptions)
}

export function useOverlayImplement (options: OverlayImplement) {
  const { overlayImplement } = inject(key) as Provider
  return overlayImplement(options)
}
