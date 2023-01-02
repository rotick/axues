import { describe, expect, test } from 'vitest'
import { resolveComputedOrActionRef } from '../src/util'
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
})
