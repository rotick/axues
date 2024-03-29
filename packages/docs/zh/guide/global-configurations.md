# 全局配置

在前面的章节中我们多次提到了全局配置，将常用的请求配置，及请求处理提升到全局来统一配置，能为我们节省很多代码，接下来我们就来看看 Axues 提供了哪些全局配置。

## 请求配置 - requestConfig

你可以将 **`每个请求都会用到的 Axios 配置项`** 写在全局的请求配置里，比如说请求超时时间、固定的请求头等等，更多配置项请参考 [Axios 请求配置](https://axios-http.com/zh/docs/req_config)

```javascript
const axues = createAxues(axios, {
  requestConfig: () => ({
    headers: { Authorization: 'foo' },
    timeout: 30000
  })
})
```

你可能会问，`axios.create` 同样也可以传入固定的配置项，为什么不直接用 `axios.create` 呢？

这是因为，`axios.create` 创建实例后，请求配置就无法再更改了，比如说用户登录后我们需要给 headers 里的 Authorization 重新赋值，但 Axios 实例创建后就无法再更改，我们不得不刷新页面才能实现这一需求。

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

上面的例子中，调用 login 方法并不会改变 Axios 实例里的 headers。而 Axues 的全局请求配置是 **`每个请求发起前`** 都会实时读取并合并到请求配置里，这为我们提供了更多的可能性。

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

以上示例我们给 `requestConfig` 传入了一个返回请求配置的方法，Axues 在每次发起请求前都会先执行这个方法，拿到全局配置后合并到请求配置中。

::: danger 合并策略
全局的请求配置只有 headers 会与组合式函数的请求配置合并，其余的均会被组合式函数的配置项覆盖。
:::

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

想象一下，如果每个请求都这样写，且如果响应数据层级过深，代码就会变得又臭又长，即便是响应数据结构比较简单，你也不得不每次都写重复的 `response.data`。

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

这里的 data 就是 `response.data.myBusinessData`，而 error 则是 `responseHandle` 返回的 Error 对象。

你可能会担忧，当应用足够复杂时，一个全局的数据处理可能不能满足需求，比如说我们需要直接请求第三方的接口，不可能要求他们按照我们的响应格式来。为了解决这一问题，Axues 在请求配置中扩展了响应数据处理策略配置项：`responseHandlingStrategy`，看一个简单的例子你就知道怎么用了：

```javascript {5}
// main.js
import { createAxues } from 'axues'
const axues = createAxues(axios, {
  responseHandle(response, { responseHandlingStrategy }) {
    if (responseHandlingStrategy === 'googleMapsApi') {
      if (response.data.status === 'OK') {
        return response.data.results
      } else {
        return new Error(response.data.error_message)
      }
    }
    if (response.data.myBusinessCode === 0) {
      return response.data.myBusinessData
    } else {
      return new Error(response.data.myBusinessErrorMsg)
    }
  }
})
```

```javascript {11}
// some-page.vue
import { useAxues } from 'axues'

const { data: muBusinessData, error: muBusinessError } = useAxues('/api/myApi')
const { data: googleMapsData, error: googleMapsError } = useAxues({
  url: 'https://maps.googleapis.com/maps/api/geocode/json',
  params: {
    place_id: 'ChIJeRpOeF67j4AR9ydy_PIzPuM',
    key: 'YOUR_API_KEY'
  },
  responseHandlingStrategy: 'googleMapsApi'
})
```

在这个例子中，我们发起了两个请求，一个是我们自己的 API，另一个是谷歌地图的 API，这两个 API 响应格式各不相同，但我们使用 `responseHandlingStrategy` 在全局响应处理函数里都很好的将它转换成我们想要的数据或错误对象，而不是在组件中去写繁琐的判断逻辑。
::: tip
你可能会想，直接判断域名做不同处理就好了，但有时候同样的域名也可能返回不一致的响应格式。以上这个例子其实还可以更简单，比如 API key 也放到全局配置中，根据域名给 `responseHandlingStrategy` 赋不同的值等等，详情请参考 [转换配置项](#转换配置项-transformuseoptions)
:::

这样的话，我们就将繁琐的数据转换挪到了全局配置里，只配一次，所有请求都能共享到，而不是每次请求都去处理。`responseHandle` 能做到更多，你可以尽情发挥你的想象力。

## 错误处理 - errorHandle

有数据处理就得对应的有错误处理，Axues 提供了全局配置项 `errorHandle` 来进行错误处理，`errorHandle` 也是接收两个参数：[Axios 的错误对象](https://axios-http.com/zh/docs/handling_errors) 和请求配置，最终返回一个错误对象。

和响应数据处理一样，全局处理之后，就不用每个请求都去写错误处理的逻辑，比如说我们的应用比较简单，发生错误时直接弹出错误信息告知用户即可。

```javascript
const axues = createAxues(axios, {
  errorHandle(error, requestConfig) {
    Toast.error(error.message)
    return error // 不管多简单，这里也必须将错误 return 出去，因为有时我们可能想在页面内展示错误信息
  }
})
```

当然真实应用中的错误处理可能比较复杂，比如我们时常需要对于不同的错误做出不同的处理，所以首先要把错误分一分类型，方便我们进行判断。以下是个例子，我们自己继承 Error 对象实现了 `UnauthorizedError`、`BusinessError` 和 `NotFoundError`：

```javascript
import { createAxues } from 'axues'
import { UnauthorizedError, BusinessError, NotFoundError } from './util/err-extend'

const axues = createAxues(axios, {
  responseHandle(response, requestConfig) {
    if (response.data.myBusinessCode === 0) {
      return response.data.myBusinessData
    } else if (response.data.myBusinessCode === 100401) {
      return new UnauthorizedError('unauthorized')
    } else {
      return new BusinessError(response.data.myBusinessErrorMsg)
    }
  },
  errorHandle(error, requestConfig) {
    if (error.response.status === 404) {
      return new NotFoundError(error.message)
    }
    return error
  }
})
```

这样我们就可以在组件中根据错误的类型来展示不同的样式。

```vue
<script setup>
import { useAxues } from 'axues'
const { error } = useAxues('/api/foo')
</script>
<template>
  <div>
    <p v-if="error.name === 'UnauthorizedError'">Unauthorized</p>
    <p v-if="error.name === 'BusinessError'">{{ error.message }}</p>
    <p v-if="error.name === 'NotFoundError'">404 not found</p>
  </div>
</template>
```

和上面提到的 `responseHandlingStrategy` 一样，你也可以使用 `errorHandlingStrategy` 配置来做不同策略的错误处理，相关示例请参考 [转换配置项](#转换配置项-transformuseoptions)，这里就不再展开。

## 错误报告 - errorReport

将请求错误上报到服务端，是最常见的应用监控手段。在 `errorHandle` 进行上报是不够的，因为我们的 `responseHandle` 也可能会返回错误，所以为了方便 Axues 又提供了 `errorReport` 配置项，用来统一的处理 `responseHandle` 和 `errorHandle` 返回的错误对象。

```javascript
import { createAxues } from 'axues'
import { BusinessError, NotFoundError } from './util/err-extend'

const axues = createAxues(axios, {
  responseHandle(response, requestConfig) {
    if (response.data.myBusinessCode === 0) return response.data.myBusinessData
    return new BusinessError(response.data.myBusinessErrorMsg)
  },
  errorHandle(error, requestConfig) {
    if (error.response.status === 404) return new NotFoundError(error.message)
    return error
  },
  errorReport(error) {
    axios.post('/api/errorReport', { err: error })
  }
})
```

也不要被它的名字限制思路，你也可以在 `errorReport` 处理错误，或者做更多有趣的事情。

## 缓存实例 - cacheInstance

Axues 提供将请求结果缓存的能力，前提是在全局配置中实现并配置一个缓存实例 `cacheInstance`。在 [缓存请求结果](./response-caching) 章节我们会详细的讲解缓存实例的配置，烦请移步查看。

## 实现反馈组件 - overlayImplement

Axues 可以很方便的集成交互组件，只需实现交互组件的调用即可，实现方式有两种：全局配置或在根组件中实现，我们在 [集成反馈组件](./with-feedback-components) 章节也会详细的介绍，烦请移步查看。

## 重写默认值 - rewriteDefault

为了简化请求配置，Axues 给一些请求配置项赋了默认值，这些默认值偏向于大部分应用场景，但你的应用可能刚好是覆盖不到的那一小部分，造成的结果就是每个请求都要显式的去配置一些配置项。

比如说 `immediate`，Axues 提供的默认值是 `false`，但如果你的应用大多数都组件创建时就需发起请求，那么你就不得不为每个请求都配置 `immediate`：

```javascript
import { useAxues } from 'axues'
const { data } = useAxues('/api/foo', { immediate: true })
```

这当然是我们不能接受的，所以 Axues 提供了重写默认值的能力，你只需在全局配置中给 `rewriteDefault` 配置为你期望的值即可。比如上上面这个例子，我们在 `rewriteDefault` 中将 `immediate` 重写为 `true`，就不用在每个请求中去配置了。

```javascript
const axues = createAxues(axios, {
  rewriteDefault: {
    immediate: true
  }
})
```

当然不是所有的配置项都有默认值，也不是所有的默认值都支持重写，以下是支持重写默认值的配置项以及它们的默认值，如果你觉得应该增加某个配置项的重写，请提 issue 告诉我们。

```typescript
{
  immediate?: boolean // default: false
  shallow?: boolean // default: false
  loadingDelay?: number // default: 300
  debounce?: boolean // default: undefined
  debounceTime?: number // default: 500
  autoRetryTimes?: number // default: 0
  autoRetryInterval?: number // default: 2
  throwOnActionFailed?: boolean // default: false
}
```

## 转换配置项 - transformUseOptions

我们的配置项看起来还是挺多，虽然我们有可以更改的默认值，但很多时候配置项之间是互相关联的，比如说我们希望配置了某个配置项，另一个配置项就自动变成某个值，这对于代码简化来说是非常有用的。

> 当然你可能会不喜欢这种不确定的感觉，那么请你忽视这个 API 的存在

用上面那个谷歌地图响应数据处理的例子来说，每次请求都写 API key 显然很麻烦且不好更换，每次都显式的配置 `responseHandlingStrategy` 也很枯燥。Axues 提供了 `transformUseOptions` 全局配置项，供你做配置项转换或关联赋值：

```javascript
// main.js
import { unref } from 'vue'
import { createAxues } from 'axues'
const axues = createAxues(axios, {
  transformUseOptions(options) {
    if (options.url.startWith('https://maps.googleapis.com')) {
      // 因为 params 的类型可能是方法也可能是 ref 对象，所以我们都要处理它
      if (typeof options.params === 'function') {
        const oldFn = options.params
        options.params = () => {
          const originalResult = oldFn.apply(oldFn, arguments)
          return Object.assign({ key: 'YOUR_API_KEY' }, originalResult)
        }
      } else {
        options.params = Object.assign({ key: 'YOUR_API_KEY' }, unref(options.params))
      }
      options.responseHandlingStrategy = 'googleMapsApi'
    }
    return options
  },
  responseHandle(response, { responseHandlingStrategy }) {
    if (responseHandlingStrategy === 'googleMapsApi') {
      if (response.data.status === 'OK') {
        return response.data.results
      } else {
        return new Error(response.data.error_message)
      }
    }
    if (response.data.myBusinessCode === 0) {
      return response.data.myBusinessData
    } else {
      return new Error(response.data.myBusinessErrorMsg)
    }
  }
})
```

我们在转换配置项时判断，如果是谷歌地图的域名，则将 API key 合并到请求参数中，并将 `responseHandlingStrategy` 自动设置为 `googleMapsApi`。这样配置之后，在组件中就不再需要配置 API key 和 responseHandlingStrategy。

```javascript
// some-page.vue
import { useAxues } from 'axues'

const { data: muBusinessData, error: muBusinessError } = useAxues('/api/myApi')
const { data: googleMapsData, error: googleMapsError } = useAxues({
  url: 'https://maps.googleapis.com/maps/api/geocode/json',
  params: { place_id: 'ChIJeRpOeF67j4AR9ydy_PIzPuM' }
})
```

再来看一个错误处理的例子，如果我们的应用是全局处理错误：将错误信息弹出告知用户，但有些页面我们又想使用不同的弹窗样式，那么我们可以配合反馈组件和转换配置项来实现：

- 在 `transformUseOptions` 判断如果传了 `errorOverlay`，就把 `errorHandlingStrategy` 设为 2
- 在 `errorHandle` 里判断如果 `errorHandlingStrategy` 为 2 则不弹出全局的弹窗

```javascript
const axues = createAxues(axios, {
  transformUseOptions(options) {
    if (options.errorOverlay) {
      options.errorHandlingStrategy = 2
    }
    return options
  },
  errorHandle(error, { errorHandlingStrategy }) {
    errorHandlingStrategy !== 2 && Toast.error(error.message)
    return error
  }
})
```

这样的话，当请求发生错误时，如果请求配置了 `errorOverlay`，我们就使用 overlayImplement 里实现的错误处理，否则使用 `Toast.error` 将错误信息弹出。

`transformUseOptions` 的作用在于转换组合式函数的请求配置，除了上面的例子，你还可以做很多事情，但请权衡利弊后再使用，毕竟它太灵活，且作用于全局，可能会造成违反协作者的直觉。
