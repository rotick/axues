# 全局配置

在前面的章节中我们多次提到了全局配置，将常用的请求配置，及请求处理提升到全局来统一配置，能为我们节省很多代码，接下来我们就来看看 Axues 提供了哪些全局配置。

## 请求配置 - requestConfig

我们在前面的章节多次提到了全局请求配置，你可以将 **`每个请求都会用到的 Axios 配置项`** 写在全局的请求配置里，比如说请求超时时间、固定的请求头等等，更多配置项请参考 [Axios 请求配置](https://axios-http.com/zh/docs/req_config)

```javascript
const axues = createAxues(axios, {
  requestConfig: () => ({
    headers: { Authorization: 'foo' },
    timeout: 30000
  })
})
```

你可能会问，`axios.create` 同样也可以传入固定的配置项，为什么不直接用 `axios.create` 呢？

这是因为，`axios.create` 创建实例后，请求配置就无法再更改了，比如说用户登录后我们需要给 headers 里的 Authorization 重新赋值，但 Axios 实例创建后就无法再更改。

```javascript
const Authorization = ref(localStorage.getItem('Authorization'))

const axiosInstance = axios.create({
  // 一旦创建了 axios 实例，这里的 Authorization 将不会再发生变化
  headers: { Authorization: Authorization.value },
  timeout: 30000
})
const axues = createAxues(axios)

function login() {
  Authorization.value = 'bar'
}
```

上面的例子中，调用 login 方法并不会改变 Axios 实例里的 headers。而 Axues 的全局请求配置是每个请求发起时都会实时读取并合并到请求配置里，这为我们提供了更多的可能性。

```javascript
const Authorization = ref(localStorage.getItem('Authorization'))

const axues = createAxues(axios, {
  requestConfig: () => ({
    // 每次请求都实时读取，保证读到最新的值
    headers: { Authorization: Authorization.value },
    timeout: 30000
  })
})

function login() {
  Authorization.value = 'bar'
}
```

以上示例我们给 `requestConfig` 传入了一个返回请求配置的方法，Axues 在每次发起请求时都会先执行这个方法，拿到全局配置后合并到请求配置中。

除了传入方法，我们也可以传入一个 `ref` 或 `computed` 对象，当然如果你的请求配置都是固定的，你也可以传入一个原始对象。

```javascript
const Authorization = ref(localStorage.getItem('Authorization'))
// 传入 ref 对象
const axues = createAxues(axios, {
  requestConfig: ref({
    headers: { Authorization: Authorization.value },
    timeout: 30000
  })
})
// 或者传入 computed 对象
const axues = createAxues(axios, {
  requestConfig: computed(() => ({
    headers: { Authorization: Authorization.value },
    timeout: 30000
  }))
})
// 如果请求配置是固定的，直接传入原始对象就好
const axues = createAxues(axios, {
  requestConfig: {
    headers: { Authorization: Authorization.value },
    timeout: 30000
  }
})
```

::: tip
如果是传入原始对象，就和 `axios.create` 没有任何区别了，如果你有性能方面的担忧，也可以直接用 `axios.create`
:::

## 响应数据处理 - responseHandle

我们知道，[Axios 的响应数据结构](https://axios-http.com/zh/docs/res_schema) 是固定的，我们要使用服务端返回的业务数据，一般直接使用 `response.data` 来获取。然而，如果我们想在响应数据里再判断业务错误码，会变得非常繁琐。

```javascript
axios.get('/user/12345').then(response => {
  if (response.data.myBusinessCode === 0) {
    console.log(response.data.myBusinessData)
  }
})
```

想象一下，如果每个请求都这样写，且如果响应数据层级过深，代码就会变得又臭又长，即使响应数据比较简单，你也不得不每次都写重复的 `response.data`。

你可能想到了解决办法，Axios 提供了 `transformResponse` 配置项，使我们可以转换响应数据，但也仅仅只是转换响应数据，如果我们想根据请求配置来转换，或者说在响应数据里处理业务错误，`transformResponse` 是做不到的。

所以，Axues 提供全局配置项 `responseHandle`，你可以配置一个接收响应数据和请求配置，并返回转换后的数据或者错误对象的方法。

```javascript
const axues = createAxues(axios, {
  requestConfig: () => ({ headers: { Authorization: 'foo' } }),
  responseHandle(response, requestConfig) {
    if (response.data.myBusinessCode === 0) {
      return response.data.myBusinessData
    } else if (response.data.myBusinessCode === 100401) {
      requestConfig.method.toLowerCase() === 'get' && router.push('/login')
      return new Error('unauthorized')
    } else {
      return new Error(response.data.myBusinessErrorMsg)
    }
  }
})
```

以上示例中，我们判断了响应数据里的 myBusinessCode 为 0 时，返回 myBusinessData。如果是 100401，我们返回一个未授权的错误，且如果是 get 请求的话就跳转登录页（只是举个例子）。如果 myBusinessCode 是其他，则直接返回服务端返回的错误信息构建的错误对象。这些错误对象会直接赋值给 `useAxues` 的 `error` 状态。

```javascript
const { data, error } = useAxues('/user/12345')
```

这里的 data 就是 `response.data.myBusinessData`，error 就是 `responseHandle` 返回的 Error 对象。

这样的话，我们就将繁琐的数据转换挪到了全局配置里，只配一次，所有请求都能共享到，而不是每次请求都去处理。`responseHandle` 能做到很多，你可以尽情发挥你的想象力。

## 转换组合式函数的配置项 - transformUseOptions
