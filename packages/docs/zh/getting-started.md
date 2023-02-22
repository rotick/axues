# 快速上手

本节我们将介绍如何将 Axues 集成到你的项目中，并提供一些最简单例子让你快速了解常用方法。开始之前，确保你项目的 Vue 版本 >= 2.7，且已经安装 axios，建议版本最好 >= 1.0.0
::: warning 为什么不支持 2.7 以下的版本？
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

## 创建 `axues` 实例

创建 axues 实例的方式和 [vue-router](https://github.com/vuejs/router) 及 [pinia](https://github.com/vuejs/pinia#usage) 一样，在你项目的入口文件（`main.js`）中调用 `createAxues` 创建实例，再把他注册成 Vue 的插件。

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

以上示例中，`createAxues` 接收了 `axios` 实例，并返回了一个新的 `axues` 实例，以方便你在创建应用时做 HTTP 请求（如果需要），更多详情请参考 [组件生命周期外使用](#组件生命周期外使用)。

```javascript
// main.js
// ...
const axues = createAxues(axios)
axues.get('/url').then(res => {
  // do something
})
// ...
```

除了接收 `axios` 实例，`createAxues` 还支持传入一些全局配置项，比如在每个请求的 header 中携带 Authorization。更多配置请参考 [全局配置]() 章节。

```javascript
// main.js
// ...
const axues = createAxues(axios, {
  requestConfig: () => ({ headers: { Authorization: 'foo' } })
})
// ...
```

## 组件中使用

注册为 Vue 插件之后，我们就可以在任意的组件中使用 Axues 的组合式函数：`useAxues`。

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

更多便捷的用法，请参考 [使用 Axues 的多种方式]() 章节。

## 组件生命周期外使用

在路由中间件中调用 HTTP 请求是一个非常常见的场景，你可以直接引用 axues 的共享实例来实现这一需求。

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
  router.beforeEach((to, from, next) => {
    if (to.meta.sendToAnalytics) {
      axues.post('/api/sendToAnalytics', { path: to.fullPath })
    }
    next()
  })
  return router
}
```

::: tip 为什么不直接用 axios 或其他请求函数？
因为使用 `axues` 可以共享你的全局配置，比如携带 Authorization 这件小事，使用其他请求函数你得再写一遍这个逻辑。
:::
