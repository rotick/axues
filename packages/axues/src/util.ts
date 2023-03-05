import {
  ConfirmOverlayOptions,
  ConfirmOverlayType,
  ContentType,
  ErrorOverlayOptions,
  Headers,
  LoadingOverlayOptions,
  LoadingOverlayType,
  MaybeComputedOrActionRef,
  MaybeComputedRef,
  SuccessOrErrorOverlayType,
  SuccessOverlayOptions
} from './types'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export function resolveComputedRef<T> (input: MaybeComputedRef<T>) {
  return input instanceof Function ? computed(input) : ref(input)
}
export function resolveComputedOrActionRef<T, TAction = any> (input: MaybeComputedOrActionRef<T>, actionPayload?: TAction): Ref<T> {
  const resolved = input instanceof Function ? input(actionPayload) : input
  return ref(resolved) as Ref<T>
}
export function resolveRequestOptions (options: any, actionPayload?: any) {
  const excludeKeys = [
    'promise',
    'immediate',
    'initialData',
    'shallow',
    'debounceMode',
    'debounce',
    'debounceTime',
    'autoRetryTimes',
    'autoRetryInterval',
    'cacheKey',
    'throwOnActionFailed',
    'confirmOverlay',
    'loadingOverlay',
    'successOverlay',
    'errorOverlay',
    'onData',
    'onSuccess',
    'onError',
    'onFinally'
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

export function transformConfirmOptions<T> (options?: ConfirmOverlayOptions<T>, actionPayload?: T) {
  let opt: ConfirmOverlayType | undefined = {
    style: 1,
    title: '',
    content: '',
    requireInputContent: false
  }
  const transformOpt = resolveComputedOrActionRef(options, actionPayload)
  if (typeof transformOpt.value === 'string') {
    opt.title = transformOpt.value
  } else {
    opt = transformOpt.value ? Object.assign(opt, transformOpt.value) : undefined
  }

  return opt
}

export function transformLoadingOptions<T> (options?: LoadingOverlayOptions<T>, actionPayload?: T) {
  let opt: LoadingOverlayType | undefined = {
    style: 1,
    text: ''
  }
  const transformOpt = resolveComputedOrActionRef(options, actionPayload)
  if (typeof transformOpt.value === 'boolean') {
    opt.text = ''
  } else if (typeof transformOpt.value === 'string') {
    opt.text = transformOpt.value
  } else {
    opt = transformOpt.value ? Object.assign(opt, transformOpt.value) : undefined
  }

  return opt
}

export function transformSuccessOptions<TAction, TO> (options?: SuccessOverlayOptions<TAction, TO>, actionPayload?: TAction, data?: TO) {
  let opt: SuccessOrErrorOverlayType | undefined = {
    style: 1,
    title: '',
    content: '',
    callback: undefined
  }
  let transformed
  if (typeof options === 'function') {
    transformed = options(actionPayload, data)
  } else {
    transformed = resolveComputedOrActionRef(options).value
  }
  if (typeof transformed === 'string') {
    opt.title = transformed
  } else {
    opt = transformed ? Object.assign(opt, transformed) : undefined
  }

  return opt
}

export function transformErrorOptions<TAction> (options?: ErrorOverlayOptions<TAction>, actionPayload?: TAction, err?: Error) {
  let opt: SuccessOrErrorOverlayType | undefined = {
    style: 1,
    title: '',
    content: '',
    callback: undefined
  }
  let transformed
  if (typeof options === 'function') {
    transformed = options(actionPayload, err)
  } else {
    transformed = resolveComputedOrActionRef(options).value
  }
  if (typeof transformed === 'string') {
    opt.title = transformed
  } else {
    opt = transformed ? Object.assign(opt, transformed) : undefined
  }

  return opt
}

export function getCacheKey<T> (cacheKey?: MaybeComputedOrActionRef<string>, actionPayload?: T) {
  return resolveComputedOrActionRef(cacheKey, actionPayload).value
}

export class CancelablePromise<T> extends Promise<T> {
  canceled = false
  constructor (executor: (resolve: any, reject?: any, cancel?: any) => void) {
    super((resolve, reject) => {
      executor(resolve, reject, () => {
        setTimeout(() => {
          this.canceled = true
        })
      })
    })
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => PromiseLike<TResult1> | TResult1) | undefined | null,
    onrejected?: ((reason: any) => PromiseLike<TResult2> | TResult2) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return (this.canceled ? this : super.then(onfulfilled, onrejected)) as Promise<TResult1 | TResult2>
  }

  catch<TResult = never>(onrejected?: ((reason: any) => PromiseLike<TResult> | TResult) | undefined | null): Promise<T | TResult> {
    // help: call action in @click, when promise reject, got an warn: [Vue warn]: Unhandled error during execution of native event handler
    return this.canceled ? this : super.catch(onrejected)
  }

  finally (onfinally?: (() => void) | undefined | null): Promise<T> {
    return this.canceled ? this : super.finally(onfinally)
  }
}
