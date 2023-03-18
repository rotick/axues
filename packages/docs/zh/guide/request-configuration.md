# 请求配置

Axues 基于 Axios，支持 Axios 的所有请求配置，在此基础上扩展了丰富的配置项，并将某些配置项扩展为响应式对象，帮助你更好的管理请求状态。

::: tip
开始之前，请确保你已经非常熟悉 [Axios 的请求配置](https://axios-http.com/zh/docs/req_config)。
:::

## Axios 配置项扩展

为了更好的配合 Vue 的组合式 API，丰富配置项的可传值类型，并实现响应式链接，Axues 对 Axios 最常用的的四个配置项 `url & params & data & headers` 进行了扩展，四个选项的扩展都是一样的，我们就放在一起来讲，为了方便，下文我们称它们为 `F4`。

### 扩展为响应式对象

一个最简单的痛点：Axios 的 url 仅支持传字符串，但有时候我们的 url 可能需要定义为响应式的 `ref` 或 `computed` 对象，那么在写这个配置时，每次都要写 `.value`，颇为麻烦。

```javascript
const url = ref(`/api/user/${route.params.id}`)
axios.get(url.value)
```

所以，`useAxues` 的 `F4` 直接就可传入响应式对象，当然这不止是解决 `.value` 这么简单的问题，就如 [Vue 组合式函数文档](https://cn.vuejs.org/guide/reusability/composables.html#async-state-example) 里提到的那样，我们希望配置项变化即发起新的请求，那么当配置项传入 `ref` 或 `computed` 对象时，我们才有监听他们变化的可能。

```javascript
const { action } = useAxues({
  url: ref('/api/users'),
  params: computed(() => ({ foo: 'bar' })),
  headers: ref({ key: 'value' })
})
action()
```

### 扩展为 getter 函数

有时，我们希望 `F4` 随着调用方的变化而变化，比如说直接在列表中来更新每一项的字段，它们调用的接口完全相同，只是传入的参数不同，所以理想情况下我们应该只用只定义一次请求，在调用请求时传入不同的参数。

上一章我们提到 action 是支持传入参数的，Axues 也将 `F4` 扩展为可以直接传入函数，所以我们只需定义一个 getter 函数，接收来自 action 的传参即可：

```javascript
const { action } = useAxues({
  url: '/api/users/update',
  method: 'post',
  data: id => ({ id }),
  headers: id => ({ id })
})
action(1)
action(2)
action(3)
```

这里 action 可以传入任意类型的参数，如果你使用 TypeScript，也可以定义它的类型。详情请参考 API。

getter 函数的意义不仅仅是接收 action 的传参，也是为了保证每次调用请求都能获取到最新的值，传入 getter 函数可能也比直接传入响应式对象更符合我们传统的直觉：

```javascript
const { action } = useAxues({
  url: () => `/api/users/update?foo=${route.params.foo}`,
  method: 'post',
  data: id => ({ id })
})
action(1)
```

### F4 的类型

```typescript
type MaybeComputedOrActionRef<T, TAction = any> = T | Ref<T> | ComputedRef<T> | ((actionPayload?: TAction) => T)
```

::: warning
如果 url 是一个函数，不能当做第一个参数传给 useAxues，必须放在请求配置对象里传。
:::

## contentType

默认情况下，Axios 会根据我们传的 data 类型来判断应该给什么 `Content-Type`，比如：

- 如果 data 传的是字符串或 `URLSearchParams` 对象， 则 `Content-Type` 为 `application/x-www-form-urlencoded`
- 如果 data 是一个原始对象，则 `Content-Type` 为 `application/json`

如果我们就想偷个懒，传一个原始对象，但要让 `Content-Type` 为 `application/x-www-form-urlencoded`，那么我们可以这样做：

```javascript
const { action } = useAxues({
  url: ref('/api/users/update'),
  method: 'post',
  data: { id: 1 },
  contentType: 'application/x-www-form-urlencoded'
})
```

每次都输入一大串字符非常麻烦，所以 Axues 也提供了常用 contentType 的缩写，相信你看到缩写名也就知道对应的是哪个 `Content-Type` 了：

```typescript
type ContentType = 'urlEncode' | 'json' | 'formData' | string
```

所以上面的例子可以简写为：

```javascript
const { action } = useAxues({
  url: ref('/api/users/update'),
  method: 'post',
  data: { id: 1 },
  contentType: 'urlEncode'
})
```

::: tip
虽然想不到有什么应用场景，但是 contentType 的类型也是 `MaybeComputedOrActionRef<ContentType>`
:::

## promise

在快速上手中我们提到了 [将请求和状态分开](./getting-started#将请求和状态分开) 正是给这个配置项传入一个 promise 函数实现的。当传入 promise 函数时，`useAxues` 将不再负责请求，而只是对传入的请求方法进行状态接管。也就是说，只要传入了 promise，再传任何其他的 Axios 配置都将失效。

所以，即使你要将请求函数单独封装，我们也推荐你使用共享全局配置的 `axues` 函数来封装，而不是直接用 `axios` 或 `fetch`。

```javascript
import { useAxues, axues } from 'axues'

const fetchUsers = () => axues.get('/api/users')

const { loading, data } = useAxues({
  promise: fetchUsers,
  immediate: true
})
```

也可以将 promise 函数直接传给第一个参数，这也是 url 当做第一个参数时不能传函数的原因。

```javascript
const { loading, data } = useAxues(fetchUsers, { immediate: true })
```

除了封装复用，promise 函数其实还有一个重要的用途：发起多个请求。

```javascript
import { useAxues, axues } from 'axues'

const fetchUsers = () => Promise.all([axues.get('/api/users'), axues.get('/api/books')])

const { loading, data } = useAxues(fetchUsers)
```

上一章节中我们提到了通过给 promise 函数传 `AbortSignal` 参数来实现取消请求，其实除了 `AbortSignal`，Axues 在调用 promise 函数时，还传了 `action` 方法携带的参数，和上面的 url 扩展一样，我们也可以根据不同的参数发起不同的请求。

```javascript
import { useAxues, axues } from 'axues'

const fetchUserById = (id, signal) => axues.get(`/api/user/${id}`, { signal })

const { action } = useAxues(fetchUserById)
action(1) // 将发起请求：/api/user/1
action(2) // 将发起请求：/api/user/2
```

## immediate & initialData

上一章节有提到这两个配置项的用法，如果忘了，就去回顾一下吧：

- [immediate](./request-states-and-methods#触发请求-action) 表示立即发起请求，而不是等着手动调用 action 方法
- [initialData](./request-states-and-methods#响应数据-data) 给定 data 的初始值，如果不给，则 data 默认是 null

## loadingDelay

配置 loading 状态的延迟，上一章节我们讲过，当请求发起时，`pending` 会立即变为 `true`，而 `loading` 会延迟 300ms（默认）后变为 `true`，如果你觉得 300ms 不太合理，那么你可以更改 `loadingDelay` 的值。

```javascript
import { useAxues } from 'axues'
const { loading, success, error, data } = useAxues({
  url: '/api/foo',
  loadingDelay: 200
})
```

如果你期望的延迟都一样，那么在每个请求都配置 `loadingDelay` 会非常麻烦，我们也可以直接在创建 Axues 实例时 [更改 loadingDelay 默认值]()

## shallow

Vue 为我们提供了性能优化的 [`shallowRef`](https://cn.vuejs.org/guide/best-practices/performance.html#reduce-reactivity-overhead-for-large-immutable-structures)，当响应数据量巨大或结构复杂时，通过配置 shallow 为 `true`，可以将 data 对象类型从 `ref` 变成 `shallowRef`，从而达到性能优化的目的。

```javascript
import { useAxues } from 'axues'
const { loading, success, error, data } = useAxues({
  url: '/api/foo',
  immediate: true,
  shallow: true
})
```

这就意味着，如果你要自定义 data 的深层赋值，且希望他响应变化，则需要自己手动来触发 `triggerRef`。

```javascript
import { triggerRef } from 'vue'
import { useAxues } from 'axues'
const { loading, success, error, data } = useAxues({
  url: '/api/foo',
  immediate: true,
  shallow: true,
  initialData: {
    page: 1,
    total: 50,
    records: {}
  },
  onData(data, newData) {
    data.value.records = newData
    triggerRef(data)
  }
})
```

## onData

在上一章的 [响应数据](./request-states-and-methods#响应数据-data) 小节中，我们提到 `onData` 给我们提供了自定义 data 赋值的能力，让我们可以在每个请求中先处理请求返回的数据，再给 data 赋值。

```javascript
import { useAxues } from 'axues'
const { loading, success, error, data } = useAxues({
  url: '/api/foo',
  immediate: true,
  initialData: [],
  onData(data, newData) {
    data.value.push(newData)
  }
})
```

除了 data 和 newData，我们还可以接收来自 action 的参数 `actionPayload`，从而处理更复杂的请求。

```javascript
import { useAxues } from 'axues'
const { action } = useAxues({
  url: '/api/foo',
  initialData: [],
  onData(data, newData, push) {
    // 这里的 push 就是 action 的传参
    if (push) {
      data.value.push(newData)
    } else {
      data.value = newData
    }
  }
})
action(true)
action(false)
```

## throwOnActionFailed

`action` 方法返回的其实是一个 promise 对象，但我们常常需要将 `action` 方法绑定到模板中，这就意味着我们没办法处理错误，如果不处理错误，当请求出错时控制台又会报错。

所以我们只能默认为 promise 用不 `reject`，即使请求错误，也是 `resolve(null)`，如果需要自己调用 `action` 并处理错误，则将 `throwOnActionFailed` 配置为 `true`，这样我们就能得到一个会 `reject` 的 promise 对象。

```javascript
import { useAxues } from 'axues'
const { action } = useAxues({
  url: '/api/400'
})
action().then().catch(console.log) // 永远不会打印错误
```

```javascript
import { useAxues } from 'axues'
const { action } = useAxues({
  url: '/api/400',
  throwOnActionFailed: true
})
action().then().catch(console.log) // 会打印错误
```

## responseHandlingStrategy & errorHandlingStrategy

Axues 提供了全局处理响应数据及错误的能力，但单一的处理策略可能不能满足我们的需求，而通过配置来控制每一个请求使用什么策略，能让我们代码简洁的同时，也更灵活。

`responseHandlingStrategy` 和 `errorHandlingStrategy` 可传入任意的值，取决于你怎么在全局处理函数中处理它，详情请参考：

- [全局响应数据处理](./global-configurations#响应数据处理-responsehandle)
- [转换配置项](./global-configurations#转换配置项-transformuseoptions)

## 更多配置项

限于篇幅，以及配置项的复杂程度，对于上文未提到的配置项，我们将专门使用一个章节来讲解，你可以点击以下的链接直达。

- [防抖](./debounce)：debounce, debounceTime
- [错误重试](./debounce)：autoRetryTimes, autoRetryInterval, retryCountdown
- [缓存请求结果](./debounce)：cacheKey
- [集成交互组件](./debounce)：confirmOverlay, loadingOverlay, successOverlay, errorOverlay
- [请求完成后的回调](./debounce)：onSuccess, onError, onFinally
