# 组件生命周期外使用

Axues 的组合式函数 `useAxues` 是基于 Vue 的 [`provide / inject`](https://cn.vuejs.org/guide/components/provide-inject.html#inject) 实现的，所以你只能在 setup 中来同步的使用它。然而很多时候我们希望在组件生命周期外使用 HTTP 请求，为满足这一需求，Axues 也提供了一个在组件生命周期外使用的请求函数。

## 使用 createAxues 返回的实例

在快速上手章节我们提到，调用 `createAxues` 方法会创建并返回一个 Axues 实例，这个实例实现了和 Axios 完全一样的 API，我们可以像使用 Axios 实例那样使用它。比如说我们要在 main.js 中来写一个请求：

```javascript
// main.js
import { createApp } from 'vue'
import axios from 'axios'
import { createAxues } from 'axues'
import App from './App.vue'

const app = createApp(App)
const axues = createAxues(axios)

axues.get('/url').then(res => {
  // do something
})

app.use(axues)
app.mount('#app')
```

因为 main.js 是我们的应用入口文件，所以理论上我们能将这个实例传入到任意一个文件中使用，比如说创建路由时将 `axues` 实例传入：

```javascript
// main.js
import { createApp } from 'vue'
import axios from 'axios'
import { createAxues } from 'axues'
import createMyRouter from './router'
import App from './App.vue'

const app = createApp(App)
const axues = createAxues(axios)
const router = createMyRouter(axues)

app.use(axues)
app.mount('#app')
```

```javascript
// router.js
import { createRouter } from 'vue-router'

export default function createMyRouter(axues) {
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

## 使用 Axues 的共享实例

从 main.js 传入实例虽好，但如果文件引用链过深，你不得不在每个文件都暴露出一个函数来接收实例，这是非常麻烦的。所有 Axues 也提供了一个共享实例（单例），调用 `createAxues` 时这个单例就会被创建，之后你就可以在任意文件中引入使用。比如说上面那个例子，在 router.js 中我们就可以这样来改造：

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

::: warning
请确保 `axues` 在 `createAxues` 之后使用，否则 `axues` 实例的方法都不会执行任何请求。
:::
Axues 的共享实例也可以在组件中使用，前面几个章节中我们也有提到，可以参考：

- [promise](./request-configuration#promise)
- [将请求和状态分开](../getting-started#将请求和状态分开)

## 为什么不直接用 Axios？

看到 `axues` 的 API 和 `axios` 完全一样，你可能忍不住会发问：为什么不直接用 `axios`？

这是因为，我们在创建 Axues 实例时，可以配置一些 [全局配置]()，比如在每个请求的 header 中携带 Authorization，或者全局处理返回值等。使用 `axues`，你可以享受到这些全局的配置。

```javascript
const axues = createAxues(axios, {
  requestConfig: () => ({ headers: { Authorization: 'foo' } }),
  responseHandle: response => response.data.businessData
})
```

虽说 Axios 也可以创建自定义实例来实现类似的全局配置，但创建和引用颇为麻烦。且 `createAxues` 提供的全局配置也不止是请求配合和请求处理，详情可以参考 [全局配置]()。

当然，你想使用 `axios` 也没有什么不妥，但有增强版的 `axues`，为何不用它呢？
