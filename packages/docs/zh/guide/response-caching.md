# 缓存请求结果

> 天下武功，无坚不破，唯快不破！

在 web 中，响应速度是永恒的话题，而缓存又是最常用来提升响应速度的手段。不管你的应用是 SPA 还是 SSR，都应该对一些必要的请求结果进行缓存。

## 配置缓存实例

要在 Axues 中使用缓存，首先得在创建 Axues 实例时就配置一个缓存实例，缓存实例的全局配置项名为 `cacheInstance`。

我们推荐你使用 [`lru-cache`](https://github.com/isaacs/node-lru-cache) 来作为缓存实例，它同时兼容服务端、客户端，且能保证内存安全，被广泛应用于 `js` 生态中，是较为理想的缓存管理库，以下是将 `lru-cache` 配置为缓存实例的例子：

```javascript
// main.js
import { createApp } from 'vue'
import axios from 'axios'
import { createAxues } from 'axues'
import LRU from 'lru-cache'

const cacheInstance = new LRU({
  maxSize: 100000,
  sizeCalculation: (value: string, key: string) => {
    return value.length + key.length
  },
  ttl: 1000 * 60 * 5
})

const app = createApp(App)
const axues = createAxues(axios, { cacheInstance })

app.use(axues)
app.mount('#app')
```

## 自己实现缓存实例

你可能觉得 `lru-cache` 有点牛刀杀鸡，其实你也可以自己实现一个最简单的缓存实例，只要遵循 `cacheInstance` 实例的 API 实现即可。比如说你的应用只是一个 SPA，而你期望用户刷新页面时缓存不丢失，那么你可以将缓存数据持久化到 `sessionStorage` 中，以下是最简单的例子：

```javascript
// main.js
// ...
const myAwesomeCache = {
  get(key) {
    return sessionStorage.getItem(key)
  },
  set(key, value) {
    sessionStorage.setItem(key, value)
  },
  delete(key) {
    sessionStorage.removeItem(key)
  }
}

const axues = createAxues(axios, {
  cacheInstance: myAwesomeCache
})
// ...
```

::: warning 注意
以上这个例子只是一个最简单的 API 示例，实际应用中你应该考虑空指针、`sessionStorage` 存储溢出等问题
:::

### cacheInstance API

不管自己实现，还是用第三方库，只要有 `get`, `set`, `delete` 方法的都可以，如果你中意的第三方库没有这几个方法，不妨给它包装一下。

```typescript
interface CacheInstance {
  get: (key: string) => unknown
  set: (key: string, value: string) => void
  delete: (key: string) => void
}
```

## 开启缓存

配置完缓存实例之后，我们就可以在任意的请求中使用缓存啦！Axues 开启缓存的方式是：传入缓存的 **全应用唯一** 的 key 名 `cacheKey`。

```javascript
import { useAxues } from 'axues'
const { pending, data } = useAxues({
  url: '/api/foo',
  immediate: true,
  cacheKey: 'myAwesomeKey'
})
```

一旦传了 `cacheKey`，Axues 即认为这个请求需要被缓存，在第一次请求成功之后，就会将数据缓存起来，之后的所有带这个 `cacheKey` 的请求，都从缓存里读取数据。所以，请保证 `cacheKey` 的唯一性。

## 动态的 cacheKey

在 [请求配置](./request-configuration) 章节我们提到，`url & params & data & headers` 四个请求配置都是可以动态配置的，这意味着我们可能每次我们的请求结果都不一样，但如果 `cacheKey` 一样，存取缓存的数据肯定就出问题了。所以我们的 `cacheKey` 也得支持动态的配置。

和 `url & params & data & headers` 一样，`cacheKey` 的类型也是 `MaybeComputedOrActionRef<string, TAction>`

```typescript
type MaybeComputedOrActionRef<T, TAction = any> = T | Ref<T> | ComputedRef<T> | ((actionPayload?: TAction) => T)
```

如果请求是动态的，那么缓存的 key 也必须是动态的，举个例子：

```javascript
const { action } = useAxues({
  url: ref('/api/users'),
  params: id => ({ id }),
  cacheKey: id => `myAwesomeKey-${id}`
})
action(1)
action(2)
```

::: tip
从理论上来说，越是变化多端的请求，我们越不应该做缓存，我们更应该缓存的是那些比较通用的数据，比如 SSR 应用中，所有用户都有可能请求的用于渲染 layout 的数据。当然，缓存什么数据完全取决于你，但在做缓存时，请时刻关注数据的正确性。
:::
