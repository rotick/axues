# 错误重试

在 [请求状态及方法](./request-states-and-methods#错误重试-retry-retrying-retrytimes) 章节中，我们提到了使用 `retry` 方法来手动触发重试。

```vue
<script setup>
import { useAxues } from 'axues'
const { pending, error, action, retry, retrying } = useAxues('/api/foo')
</script>
<template>
  <div>
    <p v-if="pending">正在请求...</p>
    <p v-if="retrying">正在重试...</p>
    <button @click="action">开始请求</button>
    <div v-if="error">
      <p>请求出错: {{ error.message }}</p>
      <button @click="retry" v-if="!retrying">重试</button>
    </div>
  </div>
</template>
```

如果我们能更进一步，一旦请求发生错误，就自动重试，不仅能让用户少点击，也能减缓用户的焦虑。特别是服务器压力大导致错误时，用户一焦虑会一直点重试，服务器会更扛不住。

## 自动重试次数

在 Axues 中，只需要配置 `autoRetryTimes` 即可开启自动重试，和它的名字一样，意为：自动重试次数，一旦配置了这个值，Axues 会在请求发生错误时自动重试。

```vue
<script setup>
import { useAxues } from 'axues'
const { pending, error, action, retrying } = useAxues({
  url: '/api/foo',
  autoRetryTimes: 2 // 最多自动重试2次
})
</script>
<template>
  <div>
    <p v-if="pending">正在请求...</p>
    <p v-if="retrying">正在重试...</p>
    <button @click="action">开始请求</button>
    <div v-if="error">
      <p>请求出错: {{ error.message }}</p>
    </div>
  </div>
</template>
```

如果一直错误就一直重试也不是个办法，所以我们得限制重试次数，`autoRetryTimes` 其实更应该理解为：`最大自动重试次数`，在未达到这个次数前，只要请求失败就会一直重试。但只要有一次请求成功，就会停止重试并重置错误状态。

## 自动重试间隔

如果一错误就立马重试，那么你大概率会对服务器造成 [DDoS 攻击](https://zh.wikipedia.org/zh-cn/%E9%98%BB%E6%96%B7%E6%9C%8D%E5%8B%99%E6%94%BB%E6%93%8A)。所以，不管是做什么类型的自动重试，你都应该设置重试间隔。

Axues 提供了配置项 `autoRetryInterval` 来供你配置重试间隔，默认是 `2`，而 Axues 并不是每发生错误后定时的 2s 后重试，和大多数的做法一样，重试间隔是呈指数倍增长的。具体的公式为：

```javascript
// 重试间隔 * 重试次数 + 重试次数
const retryTimeout = autoRetryInterval * retryTimes + retryTimes
// 所以默认情况下，第一次重试是 3s 后，第二次是 6s 后，第三次是 9s后，以此类推...
```

重试间隔小于 1 则取 1，大于 30 则取 30。所以如果无特殊需求，一般情况下你不用配置它。

## 重试倒计时
