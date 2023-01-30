import { inject, isRef } from 'vue'
import { key } from './create'
import { UseAxuesOptions, OverlayImplement, Provider, UseAxuesFirstArg } from './types'

export { axues, createAxues } from './create'

export function useAxues<TI = any, TO = any, TAction = any> (urlOrPromiseOrOptions: UseAxuesFirstArg<TI, TO, TAction>, options?: UseAxuesOptions<TI, TO, TAction>) {
  const { useFn } = inject(key) as Provider
  const firstArgIsUrl = typeof urlOrPromiseOrOptions === 'string' || isRef(urlOrPromiseOrOptions)
  const firstArgIsPromise = typeof urlOrPromiseOrOptions === 'function'
  let useOptions: UseAxuesOptions<TI, TO, TAction>
  if (firstArgIsUrl) {
    useOptions = {
      ...(options || {}),
      url: urlOrPromiseOrOptions
    }
  } else if (firstArgIsPromise) {
    useOptions = {
      ...(options || {}),
      promise: urlOrPromiseOrOptions
    }
  } else {
    useOptions = urlOrPromiseOrOptions
  }
  return useFn<TI, TO, TAction>(useOptions)
}

export function useOverlayImplement (options: OverlayImplement) {
  const { overlayImplement } = inject(key) as Provider
  return overlayImplement(options)
}
