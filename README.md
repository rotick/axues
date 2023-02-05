# axues still working in progress

Composable axios for vue, axios + vue = axues ✌️

## Features

- 🦾 Full [axios](https://github.com/axios/axios) features
- 🎭 Global request config, response and error handle
- 🎃 Response cacheable, retryable, cancelable
- ☎️ Easy to call global interactive components, such as loading, confirm, toast
- 🏍️ Out of box request debounce

## Install

```bash
npm i axuse
# or
pnpm add axuse
# or
yarn add axuse
```

Note: axues depends on axios, so you must install it too

## Useage

First, you must create axues and pass it to app, just like [vue-router](https://github.com/vuejs/router) and [pinia](https://github.com/vuejs/pinia#usage).

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

Then you can use it in any component

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

Just looking at `useAxues`, It looks like [vueuse](https://vueuse.org/core/useFetch/) or [nuxt's](https://nuxt.com/docs/api/composables/use-fetch) `useFetch`,
but why axues need to be created and registered as a plugin?

## Global request and response handle

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
    return new Error(`[${err.response.code}]${err.request.url}: ${err.message}`)
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

That is why axues need to be created first

## Various ways to useAxues

```javascript
// basic
const { loading, error, data } = useAxues('/api/foo')
// promise
const { loading, error, data } = useAxues(() => Promise.resolve({ test: 1 }))
// full axues config
const { loading, error, data } = useAxues({
  url: ref('/api/foo'), // it can be a ref, computed, or a function
  params: { foo: 'bar' },
  immediate: true
})
```
