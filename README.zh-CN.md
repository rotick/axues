<h1 align="center">axues</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/axues">
    <img src="https://badgen.net/npm/v/axues" />
  </a>
  &nbsp;
  <a href="https://bundlephobia.com/package/axues">
    <img src="https://badgen.net/bundlephobia/minzip/axues" />
  </a>
  &nbsp;
  <img src="https://badgen.net/badge/License/MIT/green" />
</p>

<p align="center">基于 <a href="https://github.com/axios/axios">axios</a> 实现的 Vue 组合式函数，使请求状态管理变得更简单</p>

<p align="center">Axios + Vue = Axues ✌️</p>

<p align="center">
  <a href="./README.md">English</a>
  |
  <span>简体中文</span>
</p>

## 特性

- 🦾 支持 [axios](https://github.com/axios/axios) 的所有特性
- ✨ 同时支持 Vue 3 和 Vue 2.7
- 🎭 全局的请求配置、响应处理及错误处理
- 🎃 响应数据可缓存，请求可重试、可取消
- 🕰️ 易于集成全局交互组件，例如 loading、confirm 弹窗，或者 toast 等
- 🏍️ 内置防抖

## 安装

```bash
npm i axues
# 或者
pnpm add axues
# 或者
yarn add axues
```

注意: 必须安装 vue >= v3 或 >= 2.7, 且 axios >= 1.0

## 使用示例

首先，创建 axues 实例，并把他当成一个插件注册到 app 中，就像使用[vue-router](https://github.com/vuejs/router) and [pinia](https://github.com/vuejs/pinia#usage) 一样。

### Vue 3

```javascript
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

### Vue 2.7

```javascript
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

然后我们就可以在任意组件使用它：

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

> 单看 `useAxues`, 它看起来很像 [vueuse](https://vueuse.org/core/useFetch/) 或 [nuxt](https://nuxt.com/docs/api/composables/use-fetch) 的 `useFetch`,
> 那 [为什么 axues 需要创建并且注册成组件？](#为什么-axues-需要创建并且注册成组件)

这个例子就是最简单的使用示例，将 `url` 传给第一个参数，`options` 传给第二个参数，
`useAxues` 将返回一些非常好用的状态和方法，我们可以将这些状态、方法直接绑定到模板中。

`options` 可以传给第一个参数：

```typescript
const { loading, success, error, data } = useAxues({
  url: '/api/foo',
  method: 'post',
  data: { foo: 'bar' },
  immediate: true
})
// 等同于
const { loading, success, error, data } = useAxues('/api/foo', {
  method: 'post',
  data: { foo: 'bar' },
  immediate: true
})
```

当然，我们也可以直接使用无渲染组件：

```vue
<template>
  <axues url="/api/foo" :immediate="true" v-slot="{ loading, success, data, error }">
    <div>
      <p v-if="loading">loading...</p>
      <div v-if="success">{{ data }}</div>
      <p v-if="error">Something went error: {{ error.message }}</p>
    </div>
  </axues>
</template>
```

### 接管 promise 的状态

有些场景下我们需要将请求封装起来以便复用，所以 `useAxues` 也支持传入任意的返回 promise 的函数。

```javascript
import { useAxues, axues } from 'axues'

const fetchUsers = () => fetch('/api/users')
const { loading, error, data } = useAxues(fetchUsers, { immediate: true })

const anyPromiseFn = () => Promise.resolve('foo')
const { loading: loading2 } = useAxues(anyPromiseFn, { immediate: true })

const fetchBooks = () => axues.get('/api/books') // same as axios api, just change a name
const { loading: loading3, data: bookData } = useAxues({
  promise: fetchBooks,
  immediate: true
})
```

### 手动执行

以上的例子都传入 `immediate` 这个配置项，意味着一载入即发起请求。如果想要手动触发请求，我们需要调用 `useAxues` 返回的 `action` 方法。

```vue
<script setup>
import { useAxues } from 'axues'
const { loading, success, error, data, action } = useAxues('/api/foo')
</script>
<template>
  <div>
    <p v-if="loading">loading...</p>
    <div v-if="success">{{ data }}</div>
    <p v-if="error">Something went error: {{ error.message }}</p>
    <button @click="action">execute</button>
  </div>
</template>
```

如果 `action` 可能会被多次调用，那么 `action` 支持传参是很有必要的：

```vue
<script setup>
import { ref } from 'vue'
import { useAxues } from 'axues'
const list = ref([1, 2, 3])
const { loading, action } = useAxues({
  url: '/api/foo',
  method: 'post',
  data: actionPayload => ({ idx: actionPayload })
})
</script>
<template>
  <div v-for="li in list">
    <input v-model="li" />
    <button @click="action(li)" :disabled="loading">save</button>
  </div>
</template>
```

> ### 为什么命名为 `action` 而不是 `execute` 或其他？
>
> 每次从请求开始到渲染完成的过程，就像是一场戏，浏览器是剧场，JS 代码是剧本，HTML 是演员，css 是道具和装扮，只要导演发出 action 指令，演员们就会根据剧本完成演绎，那谁是那个导演呢？当然是我们的用户啦。

### 内置的防抖（debounce）

默认情况下，如果 `action` 调用频率过高，axues 只会执行第一次请求，在第一次请求完成前，调用 `action` 都是无效的。

```vue
<script setup>
import { useAxues } from 'axues'
// 只会发起一次请求
const { action } = useAxues('/api/foo')
</script>
<template>
  <div>
    <button @click="action">double click me</button>
  </div>
</template>
```

如果是做搜索建议，我们需要反过来，只让最后一次调用去触发请求：

```vue
<script setup>
import { useAxues } from 'axues'
const keyword = ref('')
const { data, action } = useAxues({
  url: '/api/foo',
  params: () => ({ keyword: keyword.value }),
  debounceMode: 'lastPass',
  debounceTime: 600 // default: 500 (ms)
})
</script>
<template>
  <div>
    <input v-model="keyword" @input="action" />
    <div>
      <p v-for="k in data" @click="() => (keyword = k)">{{ k }}</p>
    </div>
  </div>
</template>
```

### 重试及刷新

在弱网环境下，请求错误后可重试对用户来说非常重要。

```vue
<script setup>
import { useAxues } from 'axues'
const { error, action, retryTimes, retryCountdown, retry, retrying } = useAxues({
  url: '/api/foo',
  autoRetryTimes: 2, // 自动重试次数
  autoRetryInterval: 3 // 自动重试间隔，默认: 2 (s)
})
</script>
<template>
  <div>
    <div v-if="error">
      <p>请求出错: {{ error.message }}</p>
      <p>
        重试次数: {{ retryTimes }}
        <button @click="retry">立即重试</button>
      </p>
    </div>
    <p v-if="retryCountdown > 0">
      {{ `将在 ${retryCountdown} 秒后重试` }}
    </p>
    <p v-if="retrying">正在重试...</p>
  </div>
</template>
```

刷新也是基操。

```vue
<script setup>
import { useAxues } from 'axues'
const { loading, success, error, data, action, refresh, refreshing } = useAxues('/api/foo')
</script>
<template>
  <div>
    <p v-if="loading">正在加载...</p>
    <p v-if="refreshing">正在刷新...</p>
    <div v-if="success">{{ data }}</div>
    <p v-if="error">请求出错: {{ error.message }}</p>
    <button @click="action">执行</button>
    <button @click="refresh">刷新</button>
  </div>
</template>
```

### 取消请求

提供反悔撤消操作也是良好用户体验的基础。

```vue
<script setup>
import { useAxues } from 'axues'
const { loading, action, canAbort, abort, aborted } = useAxues('/api/foo')
</script>
<template>
  <div>
    <p v-if="loading">加载中...</p>
    <p v-if="aborted">已取消</p>
    <button @click="action">执行</button>
    <button @click="abort" v-if="canAbort">取消请求</button>
  </div>
</template>
```

我们还可以为传入的 promise 方法提供取消操作。

```javascript
import { useAxues, axues } from 'axues'

const fetchUsers = (actionPayload, signal) => fetch('/api/users', { signal })
const { loading, canAbort, abort } = useAxues(fetchUsers, { immediate: true })

const fetchBooks = (actionPayload, signal) => axues.get('/api/books', { signal })
const { loading: loading2, abort: abort2 } = useAxues({ promise: fetchBooks, immediate: true })
```

### 分页查询

分页查询是 web 开发中非常常见的场景，使用 axues 做分页也很简单。

```vue
<script setup>
import { reactive } from 'vue'
import { useAxues } from 'axues'

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})
const { loading, action, data } = useAxues({
  url: '/api/pagination',
  params: p => ({ p: pagination.current + ~~p, s: pagination.pageSize }),
  immediate: true,
  onSuccess(data) {
    pagination.current = data.current
    pagination.total = data.total
  }
})
</script>
<template>
  <div>
    <p v-if="loading">加载中...</p>
    <p>current page: {{ pagination.current }}</p>
    <p>{{ data }}</p>
    <button v-if="pagination.current > 1" @click="action(-1)">上一页</button>
    <button @click="action(1)">下一页</button>
  </div>
</template>
```

如果是要做追加分页（无限滚动分页）：

```vue
<script setup>
// ...
const { loading, action, data } = useAxues({
  // ...
  initialData: [],
  onData: (data, newData) => data.value.push(...newData)
  // ...
})
</script>
```

### 集成交互组件

为了与 UI 与交互的一致性，我们通常会编写通用的交互组件。 这些组件在请求期间被调用，根据请求成功或失败通知用户请求状态。 比如一个删除数据的场景，如果按照传统的方式，我们会这样写：

```vue
<script setup>
import { Loading, Confirm, Toast } from 'some-UI-lib'
import axios from 'axios'
function deleteItem(id) {
  Confirm('确定要删除这条数据吗?').then(
    // 让用户确认以防误操作
    () => {
      Loading.open() // 调用loading动画组件
      axios
        .delete(`/api/delete/${id}`)
        .then(
          res => {
            Toast('已删除') // 提示用户当前状态
          },
          err => {
            Toast.error(`删除id为: [${id}] 时出错: ${err}`) // 告知用户出错
          }
        )
        .finally(Loading.close) // 关闭loading动画
    },
    () => {}
  )
}
</script>
<template>
  <div>
    <button @click="deleteItem(1)"></button>
  </div>
</template>
```

过程式的调用代码看起来就像意大利面，现在有了 axues，你可以使用声明式极大的简化代码。

```vue
<script setup>
import { useAxues } from 'axues'
const { action } = useAxues({
  url: id => `/api/delete/${id}`,
  method: 'delete',
  confirmOverlay: '确定要删除这条数据吗?',
  loadingOverlay: true,
  successOverlay: '已删除',
  errorOverlay: (id, err) => `删除id为: [${id}] 时出错: ${err}`
})
</script>
<template>
  <div>
    <button @click="action(1)"></button>
  </div>
</template>
```

当然，这一切的前提是你必须在根组件中注册这些交互组件。 在根组件中注册一次总是比每次调用都注册要好，对吧？

```vue
<!-- App.vue -->
<script setup>
import { Loading, Confirm, Toast, Modal } from 'some-UI-lib'
import { useOverlayImplement } from 'axues'
useOverlayImplement({
  loadingOpen(options) {
    Loading.open({
      text: options.text
    })
  },
  loadingClose: Loading.close,
  confirm(options) {
    return Confirm({
      title: options.title,
      content: options.content
    })
  },
  success(options) {
    if (options.style === 1) {
      // 可以使用多种样式
      Toast(options.title)
    } else {
      Modal({
        title: options.title,
        content: options.content
      })
    }
  },
  error(options) {
    if (options.style === 1) {
      Toast.error(options.title)
    } else {
      Modal({
        title: options.title,
        content: options.content
      })
    }
  }
})
</script>
<template>
  <router-view></router-view>
</template>
```

## 为什么 axues 需要创建并且注册成组件?

在实际应用中，我们通常需要在一个统一的地方处理请求和响应，
比如在每个请求头中携带 Authorization，转换响应数据，或处理错误并上报错误。

```javascript
// main.js
// ...
const axues = createAxues(axios, {
  requestConfig: () => ({
    baseURL: 'https://axues.io',
    timeout: 30000,
    headers: { Authorization: localStorage.getItem('Authorization') }
  }),
  responseHandle(response) {
    if (response.data.myBussinessCode === 401) {
      router.push('/login')
      return new Error('Unauthorized')
    }
    return response.data
  },
  errorHandle(err) {
    return new Error(`[${err.response.status}]${err.config.url}: ${err.message}`)
  }
})
app.use(axues)
```

你可能认为对每个请求都执行 requestConfig 方法会损耗一点性能，直接使用 `axios.create` 来创建 axios 实例可能是一个更好的主意.

```javascript
// main.js
// ...
const axiosInstance = axios.create({
  baseURL: 'https://axues.io',
  timeout: 30000
})
const axues = createAxues(axiosInstance, {
  requestConfig: () => ({
    // Authorization 可能会变化，这类可能变化的数据就不应该放到 axios.create 中
    headers: { Authorization: localStorage.getItem('Authorization') }
  })
  // ...
})
app.use(axues)
```

如你所见，`createAxues` 会返回一个 `axues` 的实例，这样我们在创建应用的时候就可以共享全局的请求配置，比如在 `router` 中调用请求：

```typescript
// main.js
const axues = createAxues(axios, {
  requestConfig: () => ({
    headers: { Authorization: localStorage.getItem('Authorization') }
  })
})
const router = createRouter({
  // ...
})
router.beforeEach((to, from, next) => {
  if (to.meta.sendToAnalytics) {
    axues.post('/api/sendToAnalytics', { path: to.fullPath })
  }
  next()
})
app.use(axues).use(router)
```

这就是要先创建 `axues` 实例的原因.

## 类型（typescript）

<details>
<summary>Click to show</summary>

### createAxues

```typescript
type MaybeComputedRef<T> = MaybeRef<T> | (() => T) | ComputedRef<T>

interface CreateAxuesOptions {
  requestConfig?: MaybeComputedRef<AxiosRequestConfig>
  transformUseOptions?: (options: UseAxuesOptions) => UseAxuesOptions
  responseHandle?: (response: AxiosResponse, requestConfig: AxuesRequestConfig) => unknown
  errorHandle?: (err: AxiosError, requestConfig: AxuesRequestConfig) => Error
  cacheInstance?: {
    get: (key: string) => unknown
    set: (key: string, value: string) => void
    delete: (key: string) => void
  }
  errorReport?: (err: Error) => void
  loadingDelay?: number
  overlayImplement?: {
    loadingOpen?: (options: LoadingOverlayType) => void
    loadingClose?: () => void
    success?: (options: SuccessOrErrorOverlayType) => void
    error?: (options: SuccessOrErrorOverlayType) => void
    confirm?: (options: ConfirmOverlayType) => Promise<unknown>
  }
}
interface CreateReturn extends Axues {
  install: (app: App) => void
  vue2Plugin: Plugin
}
declare function createAxues(axiosInstance: AxiosInstance, createOptions?: CreateAxuesOptions): CreateReturn
```

### axues

```typescript
type MaybeRef<T> = T | Ref<T>
type MaybeComputedRefWithoutFn<T> = ComputedRef<T> | MaybeRef<T>
type MaybeComputedOrActionRef<T, TAction = any> = MaybeComputedRefWithoutFn<T> | ((actionPayload?: TAction) => T)

interface AxuesRequestConfig<TI = any, TAction = any> extends Omit<AxiosRequestConfig, 'url' | 'headers'> {
  url?: MaybeComputedOrActionRef<string, TAction>
  params?: MaybeComputedOrActionRef<TI, TAction>
  data?: MaybeComputedOrActionRef<TI, TAction>
  contentType?: MaybeComputedOrActionRef<ContentType, TAction>
  headers?: MaybeComputedOrActionRef<RawAxiosRequestHeaders, TAction>
  responseHandlingStrategy?: any
  errorHandlingStrategy?: any
}

interface Axues {
  <TI = any, TO = any>(config: AxuesRequestConfig<TI>): Promise<TO>
  request: <TI = any, TO = any>(config: AxuesRequestConfig<TI>) => Promise<TO>
  get: <TI = any, TO = any>(url: string, config?: AxuesRequestConfig<TI>) => Promise<TO>
  delete: <TI = any, TO = any>(url: string, config?: AxuesRequestConfig<TI>) => Promise<TO>
  head: <TI = any, TO = any>(url: string, config?: AxuesRequestConfig<TI>) => Promise<TO>
  options: <TI = any, TO = any>(url: string, config?: AxuesRequestConfig<TI>) => Promise<TO>
  post: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
  put: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
  patch: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
  postForm: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
  putForm: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
  patchForm: <TI = any, TO = any>(url: string, data?: TI, config?: AxuesRequestConfig<TI>) => Promise<TO>
}
declare let axues: Axues
```

### useAxues

```typescript
interface UseAxuesOptions<TI = any, TO = any, TAction = any> extends AxuesRequestConfig<TI, TAction> {
  promise?: (actionPayload?: TAction, signal?: AbortSignal) => Promise<TO>
  immediate?: boolean
  initialData?: TO
  shallow?: boolean
  debounceMode?: 'firstPass' | 'lastPass' | 'none'
  debounceTime?: number
  autoRetryTimes?: number
  autoRetryInterval?: number
  cacheKey?: MaybeComputedOrActionRef<string, TAction>
  throwOnActionFailed?: boolean
  confirmOverlay?: ConfirmOverlayOptions<TAction>
  loadingOverlay?: LoadingOverlayOptions<TAction>
  successOverlay?: SuccessOverlayOptions<TAction, TO>
  errorOverlay?: ErrorOverlayOptions<TAction>
  onData?: (data: Ref<TO>, newData: unknown | unknown[], actionPayload?: TAction) => void
  onSuccess?: (data: TO, actionPayload?: TAction) => void
  onError?: (err: Error, actionPayload?: TAction) => void
  onFinally?: (actionPayload?: TAction) => void
}
type UseAxuesFirstArg<TI, TO, TAction> = MaybeComputedRefWithoutFn<string> | ((actionPayload?: TAction, signal?: AbortSignal) => Promise<TO>) | UseAxuesOptions<TI, TO, TAction>
interface UseAxuesOutput<TI, TO, TAction = any> {
  pending: Ref<boolean>
  loading: Ref<boolean>
  success: Ref<boolean>
  error: Ref<Error | null>
  refreshing: Ref<boolean>
  retrying: Ref<boolean>
  retryTimes: Ref<number>
  retryCountdown: Ref<number>
  requestTimes: Ref<number>
  canAbort: ComputedRef<boolean>
  aborted: Ref<boolean>
  data: Ref<TO>
  action: (actionPayload?: TAction) => PromiseLike<TO>
  retry: () => PromiseLike<TO>
  refresh: () => PromiseLike<TO>
  abort: () => void
  deleteCache: (actionPayload?: TAction) => void
  get: (params?: MaybeComputedOrActionRef<any, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  head: (params?: MaybeComputedOrActionRef<any, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  options: (params?: MaybeComputedOrActionRef<any, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  delete: (params?: MaybeComputedOrActionRef<any, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  post: (data?: MaybeComputedOrActionRef<TI, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  put: (data?: MaybeComputedOrActionRef<TI, TAction>, actionPayload?: TAction) => PromiseLike<TO>
  patch: (data?: MaybeComputedOrActionRef<TI, TAction>, actionPayload?: TAction) => PromiseLike<TO>
}
declare function useAxues<TI = any, TO = any, TAction = any>(urlOrPromiseOrOptions: UseAxuesFirstArg<TI, TO, TAction>, options?: UseAxuesOptions<TI, TO, TAction>): UseAxuesOutput<TI, TO, TAction>
```

</details>

## License

[MIT](LICENSE)
