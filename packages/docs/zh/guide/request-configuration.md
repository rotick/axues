# 请求配置

Axues 基于 Axios，支持 Axios 的所有请求配置，并在此基础上扩展了丰富的配置项，帮助你更好的管理请求状态。如果你还不太了解 Axios 的请求配置，请阅读他们的 [文档](https://axios-http.com/zh/docs/req_config)，这里不再赘述。

## Axios 配置项扩展

为了更好的配合 Vue 的组合式 API，丰富配置项的可传值类型，并实现响应式链接，Axues 对 Axios 的 `url` & `params` & `data` & `headers` 四个配置项进行了扩展。

### url 扩展

Axios 的 url 仅支持传字符串，但有时候我们的 url 可能需要定义为响应式的 `ref` 或 `computed` 对象，在传参时，每次都要写 `.value` 颇为麻烦。

```javascript
const url = ref(`/api/user/${route.params.id}`)
axios.get(url.value)
```

所以，`useAxues` 直接支持了 url 作为 `ref` 或 `computed` 对象传入，不管 `url` 怎么变，每次请求都是最新的 url：

```javascript
const url = ref(`/api/user/${route.params.id}`)
const { action } = useAxues({ url })
action()

const url2 = computed(() => `/api/user/${route.params.id}`)
const { action: action2 } = useAxues(url2)
action2()
```

有时，我们希望 url 随着调用方的变化而变化，上一章我们提到 `action` 是支持传参数的，那么我们只需定义一个 `getter` 函数，接收来自 `action` 的传参即可：

```javascript
const { action } = useAxues({ url: id => `/api/user/${id}` })
action(1) // 将发起 url 为 /api/user/1 的请求
action(2) // 将发起 url 为 /api/user/2 的请求
```

::: warning
url 是一个函数时，不能当做第一个参数传给 useAxues，必须放在请求配置对象里传
:::

### params & data & headers 扩展

和 url 一样，`params`, `data` 及 `headers` 也都支持 `ref`、`computed` 或 `getter` 函数：

```javascript
const { action } = useAxues({
  url: ref('/api/users'),
  params: computed(() => ({ foo: 'bar' })),
  headers: ref({ key: 'value' })
})
action()
```

```javascript
const { action } = useAxues({
  url: ref('/api/users/update'),
  method: 'post',
  data: id => ({ id }),
  headers: id => ({ id })
})
action(1)
```

url, params, data, headers 的类型都是 `MaybeComputedOrActionRef`，他们的用法完全一致。

```typescript
type MaybeComputedOrActionRef<T, TAction = any> = T | Ref<T> | ComputedRef<T> | ((actionPayload?: TAction) => T)
```

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

在上一章的 [响应数据](./request-states-and-methods#响应数据-data) 小节中，我们提到了 `onData`，上一个小节也有用到。`onData` 给我们提供了自定义 data 赋值的能力，让我们可以在每个请求中先处理请求返回的数据，再给 data 赋值。

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

## 更多配置项

限于篇幅，以及配置项的复杂程度，对于上文未提到的配置项，我们将专门使用一个章节来讲解，你可以点击以下的链接直达。

- [防抖](./debounce)：debounce, debounceTime
- [错误重试](./debounce)：autoRetryTimes, autoRetryInterval, retryCountdown
- [缓存请求结果](./debounce)：cacheKey
- [集成交互组件](./debounce)：confirmOverlay, loadingOverlay, successOverlay, errorOverlay
- [请求完成后的回调](./debounce)：onSuccess, onError, onFinally
