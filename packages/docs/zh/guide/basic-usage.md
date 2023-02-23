# 基础用法

::: info
我们相信在 Web 的世界里没有一种方案可以解决所有问题。所以 axues 在构思时就充分考虑了各种场景下的应用，并为这些场景设计了灵活的 API
:::

## 最简单的请求

多数的 GET 请求其实都非常简单，一个 url 就够了，所以我们的 API 也要和请求一样简单。

```vue
<script setup>
import { useAxues } from 'axues'
const { loading, success, error, data, action } = useAxues('/api/foo')
</script>
<template>
  <div>
    <p v-if="loading">loading...</p>
    <div v-if="success">{{ data }}</div>
    <p v-if="error">请求错误: {{ error.message }}</p>
    <button @click="action">开始请求</button>
  </div>
</template>
```

如果你使用过 [vueuse](https://vueuse.org/core/useFetch/) 或者 [nuxt](https://nuxt.com/docs/api/composables/use-fetch) 的 `useFetch`，一定会对这段代码感觉到非常熟悉，传入 url，返回请求的状态及触发函数（action），调用这个函数即发起请求。

手动触发可能有点麻烦，如果你想要组件创建时就发起请求，则在第二个参数里传入 `immediate: true`，意味立即执行：

```javascript
import { useAxues } from 'axues'
const { loading, error, data } = useAxues('/api/foo', { immediate: true })
```

::: tip
如果大多数请求都需要组件创建时就发起，那么每次都传 `immediate: true` 会比较麻烦，那我们只需把它的默认值设为 `true` 就好了，设置方式请参考 [重写默认值]() 章节
:::

## 配置项

`useAxues` 的第二个参数提供了非常丰富的配置项，除了 `immediate`，我们还可以将配置请求的方法、参数等等：

```javascript
const { loading, error, data } = useAxues('/api/foo', {
  method: 'post',
  params: { foo: 'bar' },
  immediate: true
})
```

这样看起来，单单 `url` 在外面似乎有点触发强迫症，把它也放到配置项里可能会比较好：

```javascript
const { loading, error, data } = useAxues({
  url: '/api/foo',
  method: 'post',
  params: { foo: 'bar' },
  immediate: true
})
```

如你所见，第一个参数不仅可以传 `url`，也可以传完整的配置项，上面两段代码作用完全相同。

`useAxues` 的配置项继承并扩展了 `axios` 的配置。

- 👉 [查看完整的 axios 配置项](https://axios-http.com/zh/docs/req_config)
- 👉 [查看 useAxues 扩展的配置项]()

## 将请求和状态分开

有时候我们需要在组件内外复用请求，但请求的状态不能复用，那么我们可以将请求和状态管理分开，首先将请求封装成一个函数，再交由 `useAxues` 来管理状态。

```javascript
import { useAxues, axues } from 'axues'

const fetchUsers = () => axues.get('/api/users')
const { loading, data } = useAxues(fetchUsers, { immediate: true })

// 如你所料，上面这段代码等同于：
const { loading, data } = useAxues({
  promise: fetchUsers,
  immediate: true
})
```

这里的 `axues` 实例和 `axios` 实例的 API 完全一样。当然，你也可以将它替换成 `axios` 或者 `fetch`，只是这样的话，请求就不能共享全局的配置（参考 [全局配置]() 章节）。

你可以简单的认为：`useAxues` 能管理任意 promise 函数的状态。

```javascript
const fetchUsers = () => fetch('/api/users')
const { loading, error, data } = useAxues(fetchUsers, { immediate: true })

const anyPromiseFn = () => Promise.resolve('foo')
const { loading: loading2 } = useAxues(anyPromiseFn, { immediate: true })
```

## 使用 Axues 组件

那些不复杂的请求，或者逻辑与视图都需要复用时，我们甚至不用写 js 代码，直接使用 Axues 的无渲染组件（不用担心怎么注册组件，Axues 在创建时就已经全局注册好了，放心，它很小）。

```vue
<template>
  <axues url="/api/foo" :immediate="true" v-slot="{ loading, success, data, error }">
    <div>
      <p v-if="loading">loading...</p>
      <div v-if="success">{{ data }}</div>
      <p v-if="error">请求出错: {{ error.message }}</p>
    </div>
  </axues>
</template>
```

::: warning
如果配置项过多，使用无渲染组件可能会让代码变得难以维护，且有一定的性能开销，详情请参考 Vue 官方文档中的 [相关章节](https://cn.vuejs.org/guide/reusability/composables.html#vs-renderless-components)
:::
