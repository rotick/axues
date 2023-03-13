# 快速上手

本节我们将介绍如何将 Axues 集成到你的项目中，并提供一些最简单例子让你快速了解 Axues 最常见的用法。开始之前，确保你项目的 Vue 版本 >= 2.7，且已经安装 [axios](https://axios-http.com/zh/)，建议 axios 版本最好 >= 1.0.0
::: tip 为什么不支持 2.7 以下的版本？
相信我，升级到 2.7 是一件收益超高的事，以我的经验来说，上千个页面的大型项目我们也只花了短短几天就升级完成了。
:::

## 安装

::: code-group

```bash [npm]
npm i axues -S
```

```bash [pnpm]
pnpm add axues
```

```bash [yarn]
yarn add axues
```

:::

## 创建 Axues 实例

创建 Axues 实例的方式和 [vue-router](https://github.com/vuejs/router) 及 [pinia](https://github.com/vuejs/pinia#usage) 一样，在你项目的入口文件（`main.js`）中调用 `createAxues` 创建实例，再把他注册成 Vue 的插件，之后你就可以在整个应用的上下文中使用这个实例。

::: code-group

```js [Vue 3.x]
// main.js
import { createApp } from 'vue'
import axios from 'axios'
import { createAxues } from 'axues'
import App from './App.vue'

const app = createApp(App)
const axues = createAxues(axios)

app.use(axues)
app.mount('#app')
```

```js [Vue 2.7]
// main.js
import Vue from 'vue'
import axios from 'axios'
import { createAxues } from 'axues'
import App from './App.vue'

const axues = createAxues(axios)
Vue.use(axues.vue2Plugin)

new Vue({
  render: h => h(App)
}).$mount('#app')
```

:::

::: tip
虽然 Vue 2.7 支持了组合式 API，但注册插件的方式无法与 Vue 3.x 一致，请根据你的需求进行选择。
:::

以上示例中，`createAxues` 接收了 `axios` 实例，并返回了一个新的 `axues` 实例，以方便你在创建应用时发起 HTTP 请求（如果需要），`axues` 实例的 API 和 `axios` 完全一致，更多详情请参考 [组件生命周期外使用](#组件生命周期外使用)。

```javascript
// main.js
// ...
const axues = createAxues(axios)
axues.get('/url').then(res => {
  // do something
})
// ...
```

如你所料，`createAxues` 也可以传入 `axios` 的自定义实例。除此之外，我们还可以给第二个参数传入一些全局配置项，比如在每个请求的 header 中携带 Authorization，或者全局处理返回值等。更多配置请参考 [全局配置]() 章节。

```javascript
// main.js
// ...
const axiosInstance = axios.create({ baseURL: 'https://axues.io' })
const axues = createAxues(axiosInstance, {
  requestConfig: () => ({
    headers: { Authorization: 'foo' },
    timeout: 30000
  }),
  responseHandle: response => response.data.businessData
  // 更多全局配置
})
// ...
```

## 使用 `useAxues` 组合式函数

创建并注册为 Vue 插件之后，我们就可以在任意的组件中使用 `useAxues` 组合式函数：

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

如果你使用过 [vueuse](https://vueuse.org/core/useFetch/) 或者 [nuxt](https://nuxt.com/docs/api/composables/use-fetch) 的 `useFetch`，一定会对这段代码感觉到非常熟悉，传入 url，返回请求的状态（`loading`、`success`等）及触发请求的函数（`action`），调用这个函数即发起请求，Axues 会在合适的时机改变请求的状态。更多状态和方法请参考 [请求状态及方法](./guide/request-states-and-methods) 章节。

### 配置项

手动触发请求可能有点麻烦，如果你想要组件创建时就发起请求，则在第二个参数里传入配置项 `immediate: true`，意味立即执行：

```javascript
import { useAxues } from 'axues'
const { loading, error, data } = useAxues('/api/foo', { immediate: true })
```

::: tip
如果大多数请求都需要组件创建时就发起，那么每次都传 `immediate: true` 会比较麻烦，那我们只需把它的默认值设为 `true` 就好了，详情请参考 [重写默认值]() 章节
:::

`useAxues` 的第二个参数提供了非常丰富的配置项，除了 `immediate`，我们还可以配置请求的方法、参数等等：

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
- 👉 [查看 useAxues 扩展的配置项](./request-configuration)

### 将请求和状态分开

有时候我们需要在组件内外复用请求，但请求的状态不能复用，那么我们可以将请求和状态管理分开，首先将请求封装成一个函数，再交由 `useAxues` 来管理状态。

```javascript
import { useAxues, axues } from 'axues'

const fetchUsers = () => axues.get('/api/users')
const { loading, data } = useAxues(fetchUsers, { immediate: true })

// 上面这段代码等同于：
const { loading, data } = useAxues({
  promise: fetchUsers,
  immediate: true
})
```

这里的 `axues` 实例和 `axios` 实例的 API 完全一样。当然，你也可以将它替换成 `axios` 或者 `fetch`，只是这样的话，请求就不能共享全局的配置（参考 [全局配置]() 章节）。

`useAxues` 能管理任意 promise 函数的状态：

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

## 组件生命周期外使用

在路由中间件中调用 HTTP 请求是一个非常常见的场景，你可以直接引用 axues 的共享实例来实现这一需求。更多用法请参考 [组件生命周期外使用](./guide/use-outside-of-components) 章节。

```javascript
// main.js
// ...
import createMyRouter from './router'
const axues = createAxues(axios, {
  /*...*/
})
const router = createMyRouter()

app.use(axues).use(router)
```

```javascript
// router.js
import { createRouter } from 'vue-router'
import { axues } from 'axues'

export default function createMyRouter() {
  const router = createRouter({
    // ...
  })
  router.beforeEach(to => {
    if (to.meta.sendToAnalytics) {
      axues.post('/api/sendToAnalytics', { path: to.fullPath })
    }
  })
  return router
}
```

::: tip 为什么不直接用 axios 或其他请求函数？
因为使用 `axues` 可以共享你的全局配置，比如携带 Authorization 这件小事，使用其他请求函数你得再写一遍这个逻辑。
:::
