# 请求配置

## 继承于 Axios 的请求配置

Axues 基于 Axios，所以是支持 Axios 的所有请求配置的，如果还不是太了解 Axios 的请求配置，请阅读他们的 [文档](https://axios-http.com/zh/docs/req_config)

## Axues 扩展的配置

为了更好的配置 Vue 的组合式 API，提升代码的简洁性，我们在 Axios 扩展了一些请求配置：

### url

有时候我们的 url 可能需要定义为 `ref` 或 `computed` 对象，在传参时，每次都要写 `.value` 颇为麻烦，且不会创建响应式链接。

```javascript
const url = ref(`/api/user/${route.params.id}`)
axios.get(url.value)
```

所以，`useAxues` 直接支持了 url 作为 `ref` 或 `computed` 对象传入，不管 `url` 怎么变，每次请求都是最新的 url：

```javascript
const url = ref(`/api/user/${route.params.id}`)
const { action } = useAxues(url)
action()

const url2 = computed(() => `/api/user/${route.params.id}`)
const { action: action2 } = useAxues(url2)
action2()
```

有时，我们希望 url 随着调用方的变化而变化，所以我们还得 `getter` 函数：

```javascript
const { action } = useAxues({
  url: id => `/api/user/${id}`
})
action(1) // 将发起 url 为 /api/user/1 的请求
action(2) // 将发起 url 为 /api/user/2 的请求
```

::: warning
url 是一个函数时，不能当做第一个参数传给 useAxues，比如放在请求配置对象里传
:::

### params & data & headers

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

### contentType

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
