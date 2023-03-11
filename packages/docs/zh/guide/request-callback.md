# 请求完成后的回调

请求完成后回调执行其他任务是很常见的需求，常见的做法是返回 promise 对象，我们在 then 或 catch 中去处理回调。然而 `useAxues` 函数返回的是状态和方法，为了 API 的简洁性我们没有支持直接返回 promise，但你仍然可以以更好的方式来实现这个需求。

## 请求配置中传入回调函数

Axues 的请求配置提供了三个回调函数：`onSuccess, onError, onFinally`，分别用来处理请求成功、请求失败及请求完成时的回调。

```javascript
import { useAxues } from 'axues'
const { action } = useAxues({
  url: '/api/foo',
  onSuccess() {
    console.log('success')
  },
  onError() {
    console.log('error')
  },
  onFinally() {
    console.log('finish')
  }
})
action()
```

在回调里使用请求返回的数据，或者是错误信息，也是很常见的需求。Axues 会在调用这些回调时传入数据或错误对象：

```javascript
import { useAxues } from 'axues'
const { action } = useAxues({
  url: '/api/foo',
  onSuccess(data) {
    console.log(data)
  },
  onError(err) {
    console.log(err)
  },
  onFinally() {
    console.log('finish')
  }
})
action()
```

除了请求返回的对象，有时我们也想要用触发请求时携带的数据，那么你可以这样来用：

```javascript
import { useAxues } from 'axues'

const actionPayload = { foo: 'bar' }

const { action } = useAxues({
  url: '/api/foo',
  onSuccess(data, payload) {
    console.log(data, payload)
  },
  onError(err, payload) {
    console.log(err, payload)
  },
  onFinally(payload) {
    console.log('finish', payload)
  }
})
action(actionPayload)
```

## 在调用 action 时处理回调

在 [请求配置](./request-configuration#throwonactionfailed) 章节我们讲过，`action` 方法会返回一个 promise 对象，且默认情况下，成功会 resolve 数据，失败则 resolve 一个 null，所以我们也可以利用这个机制来做回调。

```javascript
import { useAxues } from 'axues'
const { action } = useAxues({
  url: '/api/foo'
})
action().then(res => {
  if (res) {
    console.log('success')
  } else {
    console.log('error')
  }
  console.log('finish')
})
```

这样做可能不太优雅，且这样做我们拿不到错误对象，所以配合 `throwOnActionFailed` 来做可能会更好一点。

```javascript
import { useAxues } from 'axues'
const { action } = useAxues({
  url: '/api/foo',
  throwOnActionFailed: true
})
action()
  .then(console.log)
  .catch(console.log)
  .finally(() => {
    console.log('finish')
  })
```

以上两种方式没有孰好孰坏，完全取决于你的喜好。
