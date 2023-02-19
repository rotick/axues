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

<p align="center">Vue composable powered by <a href="https://github.com/axios/axios">axios</a> for easier request state management</p>

<p align="center">Axios + Vue = Axues ✌️</p>

<p align="center">
  <span>English</span>
  |
  <a href="./README.zh-CN.md">简体中文</a>
</p>

## Features

- 🦾 Full [axios](https://github.com/axios/axios) feature support
- ✨ Supports Vue 3 and Vue 2.7
- 🎭 Global configuration for requests, handling of responses and errors
- 🎃 Responses cacheable, request retryable and cancellable
- 🕰️ Simple integration with global interactive components, such as loading indicators, confirm dialogs, and toasts
- 🏍️ Built-in request debouncing

## Install

```bash
npm i axues
# or
pnpm add axues
# or
yarn add axues
```

Note: Requires vue >= v3 or >=2.7, and axios >=1.0

## Usage

First, create axues as a plugin and pass it to app, just like [vue-router](https://github.com/vuejs/router) and [pinia](https://github.com/vuejs/pinia#usage).

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

Then we can use it in any component:

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

> Just looking at `useAxues`, It looks like [vueuse](https://vueuse.org/core/useFetch/) or [nuxt's](https://nuxt.com/docs/api/composables/use-fetch) `useFetch`,
> but [why axues need to be created and registered as a plugin?](#why-axues-need-to-be-created-and-registered-as-a-plugin)

In this case, we got the simplest usage, pass `url` to to first argument, and `options` to second argument, `useAxues` will return some very useful states and methods, so that we can easily bind to the template.

The `options` also can be pass to first argument.

```typescript
const { loading, success, error, data } = useAxues({
  url: '/api/foo',
  method: 'post',
  data: { foo: 'bar' },
  immediate: true
})
// equivalent to
const { loading, success, error, data } = useAxues('/api/foo', {
  method: 'post',
  data: { foo: 'bar' },
  immediate: true
})
```

Of course, we can also use the renderless component.

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

### Take over the state of promise

Sometimes it might be a good idea to wrap the request, `useAxues` can also pass in an any promise function.

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

### Manually execute

The above examples all pass an `immediate` configuration, which means it will be executed immediately. If want to execute it manually, we need to call the `action` method returned by `useAxues`.

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

If the `action` is to be called multiple times, it is necessary to support parameter passing.

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

> ### Why named as `action` instead of `execute` or others?
>
> The process from the beginning of a request to the completion of rendering is like a play, where the browser serves as the theater, the JS code as the script, HTML as the actors, and CSS as the props and costumes. As long as the director issues `action` instructions, the actors will perform according to the script. So who is the director? Of course, it's our user.

### Built-in debounce

By default, when the `action` is called frequently, it will only be executed if the previous request is completed, otherwise it will be ignored.

```vue
<script setup>
import { useAxues } from 'axues'
// will only send request once
const { action } = useAxues('/api/foo')
</script>
<template>
  <div>
    <button @click="action">double click me</button>
  </div>
</template>
```

If we are doing search suggestions, we need to reverse, only the last call triggers the request.

```vue
<script setup>
import { useAxues } from 'axues'
const keyword = ref('')
const { data, action } = useAxues({
  url: '/api/foo',
  params: { keyword },
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

### Retry and refresh

Retries are very important for users in weak network environments.

```vue
<script setup>
import { useAxues } from 'axues'
const { error, action, retryTimes, retryCountdown, retry, retrying } = useAxues({
  url: '/api/foo',
  autoRetryTimes: 2,
  autoRetryInterval: 3 // default: 2 (s)
})
</script>
<template>
  <div>
    <div v-if="error">
      <p>Something went error: {{ error.message }}</p>
      <p>
        retryTimes: {{ retryTimes }}
        <button @click="retry">retry now</button>
      </p>
    </div>
    <p v-if="retryCountdown > 0">
      {{ `will auto retry after ${retryCountdown}s` }}
    </p>
    <p v-if="retrying">retrying...</p>
  </div>
</template>
```

Refresh is also essential.

```vue
<script setup>
import { useAxues } from 'axues'
const { loading, success, error, data, action, refresh, refreshing } = useAxues('/api/foo')
</script>
<template>
  <div>
    <p v-if="loading">loading...</p>
    <p v-if="refreshing">refreshing...</p>
    <div v-if="success">{{ data }}</div>
    <p v-if="error">Something went error: {{ error.message }}</p>
    <button @click="action">execute</button>
    <button @click="refresh">refresh</button>
  </div>
</template>
```

### Abort request

Providing the option for undo is also a fundamental aspect of a great user experience.

```vue
<script setup>
import { useAxues } from 'axues'
const { loading, action, canAbort, abort, aborted } = useAxues('/api/foo')
</script>
<template>
  <div>
    <p v-if="loading">loading...</p>
    <p v-if="aborted">aborted</p>
    <button @click="action">execute</button>
    <button @click="abort" v-if="canAbort">abort</button>
  </div>
</template>
```

We can also provide a cancel operation for the promise method that is passed in.

```javascript
import { useAxues, axues } from 'axues'

const fetchUsers = (actionPayload, signal) => fetch('/api/users', { signal })
const { loading, canAbort, abort } = useAxues(fetchUsers, { immediate: true })

const fetchBooks = (actionPayload, signal) => axues.get('/api/books', { signal })
const { loading: loading2, abort: abort2 } = useAxues({ promise: fetchBooks, immediate: true })
```

### Pagination query

Pagination queries are a very common scenario in web development and using axues to do pagination is also very simple.

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
    <p v-if="loading">loading...</p>
    <p>current page: {{ pagination.current }}</p>
    <p>{{ data }}</p>
    <button v-if="pagination.current > 1" @click="action(-1)">prev page</button>
    <button @click="action(1)">next page</button>
  </div>
</template>
```

If you want to append rather than replace the data.

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

### With interactive components

For consistency with UI and interaction, we often write common interactive components. These components are called during requests, upon successful or failed request, to inform the user of the request status. For example, in a scenario of deleting data, if done in a traditional manner, we would write it like this:

```vue
<script setup>
import { Loading, Confirm, Toast } from 'some-UI-lib'
import axios from 'axios'
function deleteItem(id) {
  Confirm('are you sure to delete it?').then(
    () => {
      Loading.open()
      axios
        .delete(`/api/delete/${id}`)
        .then(
          res => {
            Toast('deleted')
          },
          err => {
            Toast.error(`delete id: [${id}] got an error: ${err}`)
          }
        )
        .finally(Loading.close)
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

The procedural invocation code looks like spaghetti, but now with axues, you can greatly simplify your code using a declarative approach.

```vue
<script setup>
import { useAxues } from 'axues'
const { action } = useAxues({
  url: id => `/api/delete/${id}`,
  method: 'delete',
  confirmOverlay: 'are you sure to delete it?',
  loadingOverlay: true,
  successOverlay: 'deleted',
  errorOverlay: (id, err) => `delete id: [${id}] got an error: ${err}`
})
</script>
<template>
  <div>
    <button @click="action(1)"></button>
  </div>
</template>
```

Of course, all of this is predicated on the fact that you must register these interactive components in the root component. Registering in the root component is always better than registering each time you call, right?

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

## why axues need to be created and registered as a plugin?

In practical application, we usually need to process request and response in a unified place,
For example, carry Authorization in each request header, convert the response data,
or handle error and report error.

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

You may think that executing the requestConfig method for each request will consume a bit of performance,
it might be a better idea to use `axios.create` directly to create the axios instance

```javascript
// main.js
// ...
const axiosInstance = axios.create({
  baseURL: 'https://axues.io',
  timeout: 30000
})
const axues = createAxues(axiosInstance, {
  requestConfig: () => ({
    headers: { Authorization: localStorage.getItem('Authorization') }
  })
  // ...
})
app.use(axues)
```

As you can see, `createAxues` will return an instance of axues so that we can share the global configuration when creating the application, for example, requesting it in the router:

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

That is why axues need to be created first.

## Types

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
