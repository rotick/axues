# 防抖

不管写什么样的请求，只要是交由用户来触发的请求，我们都应该做防抖。否则如果用户操作不当，会造成多次重复请求，更糟糕的是如果请求会修改数据，有可能会产生脏数据或错误数据。

一般防抖有两种：`防止重复请求` 和 `防止频繁请求`，下面我们一一细说：

## 防止重复请求

其实我们用的最多的是防止重复请求，因为但凡是用户操作触发的请求，我们都需要处理它。
:::info
如果你还不理解为什么要处理，那么请想象一下：假如你在写一个新建文章的页面，用户点击保存按钮即发起请求，那么万一用户手滑多点了一下按钮，或者用户就习惯双击，那么你将产生两条一模一样的文章数据，如果用户疯狂连击呢？
:::

传统的做法有两种：

- 用户操作之后立即弹出 loading 遮罩，请求结束后再关闭遮罩，这样用户后面的操作都作用于遮罩上，不会重复触发请求
- 用户操作之后立即禁用操作，直到请求结束，比如说点击按钮后立即禁用按钮，这样用户也不能多次点击

其实最佳的做法是两者的结合，因为我们不希望用户一点击按钮就弹出 loading，而是延时个 100~200ms 再弹出（Axues 默认支持 loading 延时，[详情]()），这样的话只要请求足够快，用户是不用看到令人焦虑的 loading 动画的。这种做法不能说有什么弊端，只能说：麻烦！

Axues 的默认防抖策略就是防止重复请求，无需任何配置。在第一次请求返回结果前，不管调用多少次 action，都不会触发重复的请求

```vue
<script setup>
import { useAxues } from 'axues'
// 不管几连，在第一次请求返回结果前，都不会再发送请求
const { action } = useAxues('/api/foo')
</script>
<template>
  <button @click="action">一键三连</button>
</template>
```

## 防止频繁请求

防止频繁请求一般用于触发比较频繁的事件中，比如滚动事件或键盘输入事件。搜索建议就是一个很典型的例子，传统的做法是这样的：

```vue
<script setup>
import axios from 'axios'
import { debounce } from 'lodash-es'

const keyword = ref('')
const suggest = ref([])

function request() {
  axios.get('/api/foo', { keyword: keyword.value }).then(res => {
    suggest.value = res.data
  })
}

const action = debounce(request, 500)
</script>
<template>
  <input v-model="keyword" @input="action" />
  <div>
    <p v-for="k in suggest" @click="() => (keyword = k)">{{ k }}</p>
  </div>
</template>
```

在这个例子中，当用户在 input 中输入文字时，会开启一个 500ms 的定时器，如果 500ms 内没有再输入任何文字，就发起请求。反之则清除上一个定时器，然后再开启一个新的定时器。

如果你经验足够丰富，一定知道这段代码是有问题的，问题是：如果接口返回结果的速度不一致，比如说输入停顿再输入时，我们预期是返回最后一次输入的建议，但如果前几次的请求比最后一次慢，那么 `suggest` 最终的值就不是最后一次输入的建议，从而导致错误的结果。

所以 Axues 在设计时就通过机制避免了这个问题，将 `debounceMode` 配置为 `lastPass`，则切换到防止频繁请求模式，还可以通过 `debounceTime` 来改变防抖的间隔。

```vue
<script setup>
import { useAxues } from 'axues'

const keyword = ref('')
const { data: suggest, action } = useAxues({
  url: '/api/foo',
  params: () => ({ keyword: keyword.value }),
  debounceMode: 'lastPass',
  debounceTime: 600 // 默认: 500 (ms)
})
</script>
<template>
  <div>
    <input v-model="keyword" @input="action" />
    <div>
      <p v-for="k in suggest" @click="() => (keyword = k)">{{ k }}</p>
    </div>
  </div>
</template>
```
