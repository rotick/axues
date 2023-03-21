# 分页查询

分页查询在 web 开发中是非常重要的数据查询场景，但凡涉及数据集查询，都会用到分页。要做好分页查询的状态管理也不是一件容易的事，本章将引导你使用 Axues 实现一个完整的分页列表页。

## 最简单的分页

分页查询的核心在于页码，我们必须确保发起请求时请求参数中携带正确的页码。在请求配置章节已经提到，我们可以将请求参数配置为响应式对象，并监听它变化从而发起新的请求，用这个特性来实现分页请求再好不过了。

```vue
<script setup>
import { useAxues } from 'axues'
import { ElPagination } from 'element-plus'

const currentPage = ref(1)
const size = ref(20)
const total = ref(0)

const params = computed(() => ({
  page: currentPage.value,
  size: size.value
}))
const { data, loading, error, retry, retrying } = useAxues({
  url: '/api/paginated',
  params,
  watch: 'params',
  onData(data, newData) {
    data.value = newData.records
    total.value = newData.totalCount
  }
})
</script>
<template>
  <div>
    <div v-loading="loading">
      <div v-if="!error">{{ data }}</div>
      <div v-if="error">
        {{ error.message }}
        <button @click="retry" v-if="!retrying">重试</button>
      </div>
    </div>
    <el-pagination v-model:current-page="currentPage" v-model:page-size="size" :page-sizes="[20, 50, 100, 200]" layout="total, prev, pager, next" :total="total" />
  </div>
</template>
```

在这个例子中，我们使用了 [`element-plus`](https://element-plus.org/zh-CN/component/pagination.htm) 的分页组件，并定义了一个返回请求参数的计算型属性，在配置 Axues 的请求配置时，我们直接将这个计算型属性传给 `params`，并监听它。这样一来，只要操作分页组件导致页码或每页条数变化，就会重新发起请求。

由于我们不知道总条数是多少，所以在数据处理函数 `onData` 中我们必须给 total 赋值为服务端返回的值，当然你想在 `onSuccess` 中赋值也是可以的，这里因为我们要在 `onData` 里处理 `data` 的赋值，所以就放在一起了。

## 无限滚动分页

上面的例子在 PC 端比较常见，而在移动端中大都是无限滚动的分页，唯一的区别是，无限滚动分页要追加数据，而普通的分页是替换数据，所以理论上我们只用在 `onData` 里做不同的处理即可。

```vue
<script setup>
import { useAxues } from 'axues'
import { LoadMore } from 'my-awesome-components'

const currentPage = ref(1)
const size = ref(20)
const total = ref(0)

const params = computed(() => ({
  page: currentPage.value,
  size: size.value
}))
const { data, pending } = useAxues({
  url: '/api/paginated',
  params,
  watch: 'params',
  initialData: [],
  onData(data, newData) {
    data.value.push(...newData.records)
    total.value = newData.totalCount
  }
})

function onLoad() {
  currentPage.value++
}
</script>
<template>
  <load-more v-if="total > size" :loading="pending" :finish="total > 0 && currentPage * size > total" @load="onLoad" />
</template>
```

这个例子中，我们封装了一个 LoadMore 组件，当滚动触底时则触发 load 事件，当当前页 \* 每页条数大于总条数时则不再触发。每次触发 load 事件，都给 currentPage 的值加 1，和上面的例子一样，当 currentPage 变化时，Axues 就会重新发起请求，不同的是，我们这里将 data 的初始值定义为了一个空数组，每次数据返回时都将数据 push 进 data 中。

乍一看没什么问题，但请求可能会发生错误，当请求错误时，currentPage 已经加了 1，我们必须在 onError 里给它减回来，保证重试时页码正确，但一减就又会触发请求。

如果加上错误处理，监听响应式对象变化这套大概率是行不通的，但是别忘了，Axues 还有手动发起请求的 `action` 方法，让我们来试试 load 事件中直接绑定 `action` 方法：

```vue
<script setup>
import { useAxues } from 'axues'
import { LoadMore } from 'my-awesome-components'

const currentPage = ref(0)
const size = ref(20)
const total = ref(0)

const { data, pending, error, retry } = useAxues({
  url: '/api/paginated',
  params: () => ({
    page: currentPage.value + 1,
    size: size.value
  }),
  immediate: true,
  initialData: [],
  onData(data, newData) {
    data.value.push(...newData.records)
    currentPage.value += 1
    total.value = newData.totalCount
  }
})
</script>
<template>
  <load-more v-if="total > size" :loading="pending" :finish="total > 0 && currentPage * size > total" @load="action" :error="error" @retry="retry" />
</template>
```

在这个例子中，我们对上例做了如下改进：

- 将 currentPage 初始值设为 0，每次发起请求时，请求参数页码的值为 currentPage + 1
- 声明了 immediate 为 true，意味着组件创建时会立即请求第一页的数据
- 每次请求成功后，将 currentPage 累加，确保失败后重试的页码正确

这样一来，我们基本上实现了一个完整的无限滚动分页列表，得益于 Axues 的 [防抖机制](./debounce)，你甚至不用在 LoadMore 组件里实现防抖。当然你还有其他的实现办法，比如页码通过 `action` 传参来传，这取决你的 LoadMore 组件如何实现。

## 更复杂的分页

在实际应用中，我们的分页列表往往搭配着各种筛选条件使用，每次切换筛选，我们就得重刷整个列表
