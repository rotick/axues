# 简介

## Axues 是什么？

Axues（发音类似于`艾克修斯`）是一款基于著名的 HTTP 请求库 `axios` 封装的 [Vue 组合式函数](https://cn.vuejs.org/guide/reusability/composables.html)。
它提供了一套声明式的 API，并提供了全局处理请求、响应及错误的能力，帮助你更高效的管理 HTTP 请求的状态。

::: tip Axues 命名的由来
将 `Axios` 和 `Vue` 这两个单词做拆词组和，就得到了 `Axues` 这个名称：`Axios + Vue = Axues`，将 v 藏入 x 中，io 往后移动，就成了我们的域名：axues.io
:::

下面是一个最基本的示例：

```vue
<script setup>
import { useAxues } from 'axues'
const { loading, success, error, data } = useAxues('/api/foo', { immediate: true })
</script>
<template>
  <div>
    <p v-if="loading">loading...</p>
    <div v-if="success">{{ data }}</div>
    <p v-if="error">Something went error: {{ error.message }}</p>
  </div>
</template>
```

上面的示例展示了 Axues 的两个核心功能：

- **声明式 API：** 声明请求的 url 为 `/api/foo`，并声明立即执行，组件创建时则会立即发起请求。
- **响应式的请求状态：** `useAxues` 返回的状态，都可以直接绑定到模板中，而不需要自己再去定义并绑定响应式变量。

## 为什么用 Axues？

看上面的例子，你肯定会想，又是一个闲不住的仿造轮子。

其实 Axues 的诞生正是因为当下社区中存在的轮子有些不够生产力，有些直接搬 React，引入了很多复杂的概念，且不符合 Vue 的美学（简单、符合直觉）。

举个例子：几乎的大中型项目请求头都需要携带 Authorization，但很多相关的组合式函数要么直接不提供统一配置的地方，要么需要自己去封装请求方法。而这一需求，在 Axues 中实现起来非常简单：

```javascript
// main.js
import { createApp } from 'vue'
import axios from 'axios'
import { createAxues } from 'axues'
import App from './App.vue'
import { useAuthorization } from './composables'

const app = createApp(App)
const { authorization } = useAuthorization()

const axues = createAxues(axios, {
  requestConfig: () => ({ headers: { Authorization: authorization.value } })
})

app.use(axues)
app.mount('#app')
```

在这个例子中，我们创建了 Axues 实例，并将 headers 赋值给了全局的 `requestConfig`，这样我们在所有组件中调用 `useAxues` 时，请求都会携带这个 header，
且当 authorization 发生变化时，全局的 headers 也会取到最新的 authorization。

当然，如果你能保证 authorization 不会发生变化，其实也可以这样写：

```javascript
// ...
const axiosInstance = axios.create({
  headers: { Authorization: authorization.value }
})
const axues = createAxues(axiosInstance)
// ...
```

## Axues 适用于哪些场景？

理论上，所有的 Vue 版本 >= 2.7 的项目都可以使用 Axues，得益于 `axios` 良好的服务端支持，Axues 也可以用在 SSR 项目中（比如 nuxt），
Axues 实际上就是 Vue 和 Axios 的粘合剂，只要是他们支持的环境，都可以使用 Axues
