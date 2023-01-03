import { describe, expect, test } from 'vitest'
import { resolveComputedOrActionRef, resolveRequestOptions, mergeHeaders, transformConfirmOptions } from '../src/util'
import { ref, computed } from 'vue'

describe('util', () => {
  test('resolveComputedOrActionRef', () => {
    const testRef = ref(1)
    const testComputed = computed(() => false)
    const actionFunc = (actionPayload: number) => {
      return actionPayload + 1
    }
    expect(resolveComputedOrActionRef('abc').value).toBe('abc')
    expect(resolveComputedOrActionRef(testRef).value).toBe(1)
    expect(resolveComputedOrActionRef(testComputed).value).toBe(false)
    expect(resolveComputedOrActionRef(actionFunc, 3).value).toBe(4)
    expect(resolveComputedOrActionRef(actionFunc).value).toBeNaN()
  })

  test('resolveRequestOptions', () => {
    const opt = resolveRequestOptions({ url: '/path/to' })
    expect(Object.keys(opt).length).toBe(5)
    expect(opt.url.value).toBe('/path/to')
  })

  test('mergeHeaders', () => {
    const data = mergeHeaders({ a: 1 }, { b: 2 }, 'urlEncode')
    expect(data).toEqual({
      a: 1,
      b: 2,
      'Content-Type': 'application/x-www-form-urlencoded'
    })
  })

  test('transformConfirmOptions', () => {
    expect(transformConfirmOptions('are you sure?')).toStrictEqual({
      style: 1,
      title: 'are you sure?',
      content: '',
      requireInputContent: false
    })
    expect(transformConfirmOptions(ref('are you sure?'))).toStrictEqual({
      style: 1,
      title: 'are you sure?',
      content: '',
      requireInputContent: false
    })
    expect(transformConfirmOptions(computed(() => 'are you sure?'))).toStrictEqual({
      style: 1,
      title: 'are you sure?',
      content: '',
      requireInputContent: false
    })
    expect(transformConfirmOptions((text: any) => `${text as string} are you sure?`, 'hello')).toStrictEqual({
      style: 1,
      title: 'hello are you sure?',
      content: '',
      requireInputContent: false
    })
  })
})
