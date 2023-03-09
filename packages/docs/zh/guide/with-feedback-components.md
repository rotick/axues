# 集成反馈组件

反馈组件又称为交互组件，只要是对用户的操作做出反馈或者与用户有交互的组件，我们都统称为反馈组件。反馈组件是 HTTP 请求的最佳拍档，不管写什么请求，都会与它们打交道。比如：写一个删除数据的请求时，我们需要先调用 confirm 组件让用户确认，然后是 loading 组件，请求成功或失败后再调用提示类的组件等等。

## 传统的做法

通常我们会将反馈组件的状态封装并暴露出可以直接调用的 API，这样就不用在页面中再维护反馈组件的状态，我们继续用删除数据的请求来举例子：

```vue
<script setup>
import { Loading, Confirm, Toast } from 'my-awesome-UI-lib'
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

过程式的调用代码看上去很直观，我们可以轻松的理解代码的调用流程。但是，像这样几乎固定的流程重复写上 10 个页面，你就会开始受不了了，而且如果每个页面都这样写，如果有一天要更换 UI 组件库，你将不得不挨个页面去改这些重复的代码。

## 解决痛点

既然删除操作都要经过 confirm, loading, 成功 toast 或 失败 toast，其他类型请求也无外乎就是这几个，那么我们是不是可以将这些 API 也封装进请求中，只用在请求配置定义文案呢？比如我们将上面的例子这样来改造：

```javascript
// request.js
import { Loading, Confirm, Toast } from 'my-awesome-UI-lib'
import axios from 'axios'

function request({ url, method, confirmText, isLoading, successText, errorText }) {
  function req() {
    isLoading && Loading.open() // 调用loading动画组件
    axios({
      url,
      method
    })
      .then(
        res => {
          successText && Toast(successText) // 提示用户当前状态
        },
        err => {
          errorText && Toast.error(errorText) // 告知用户出错
        }
      )
      .finally(Loading.close) // 关闭loading动画
  }
  if (confirmText) {
    Confirm(confirmText).then(req, () => {})
  } else {
    req()
  }
}

export default request
```

```vue
<script setup>
import request from './request.js'
function deleteItem(id) {
  request({
    url: `/api/delete/${id}`,
    method: 'delete',
    confirmText: '确定要删除这条数据吗?',
    isLoading: true,
    successText: '删除成功',
    errorText: '删除失败'
  })
}
</script>
<template>
  <div>
    <button @click="deleteItem(1)"></button>
  </div>
</template>
```

在 `request` 方法里判断，只要传了值，就调用相应的反馈组件。然后将 `request` 方法抽离成一个独立模块，每个页面都只用引入并使用 `request` 方法即可，大幅简化了我们的重复代码。

不仅如此，我们同时也解决了未来可能更换组件库的问题，不管怎么更换，我们都只用修改 `request` 方法，一举两得！

## 在 Axues 中使用反馈组件

基于上面的例子及说明，你或许也猜到了，Axues 的请求配置里直接就可以配置这些反馈组件的参数，Axues 会在合适的时机来帮你调用。

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

::: tip 为什么要命名为 xxxOverlay？
因为我们的 4 个反馈组件几乎都是弹出层，而有些时候我们希望直接将状态绑定到页面中的反馈组件，所以为了更好区分，我们直接在命名中加入了 overlay，一眼就能看出这里调用的是弹出层而不是页面内联的组件。
:::
能调用的前提是你必须先实现这些反馈组件，Axues 当然不会内置 UI 组件，接下来我们就来看怎么来实现反馈组件。

## 实现反馈组件

在创建 Axues 实例时传入实现方法，即可实现反馈组件，但考虑到创建 Axues 实例时，有些 UI 组件还不能被挂载，所以我们也提供了第二种方式：在根组件（App.vue）中调用方法来实现。

### 创建时实现

```javascript
// main.js
import { createApp } from 'vue'
import axios from 'axios'
import { createAxues } from 'axues'
import { Loading, Confirm, Toast, Modal } from 'my-awesome-UI-lib'

const app = createApp(App)
const axues = createAxues(axios, {
  overlayImplement: {
    loadingOpen: options => Loading.open({ text: options.text }),
    loadingClose: Loading.close,
    confirm(options) {
      return Confirm({
        title: options.title,
        content: options.content
      })
    },
    success: options => Toast(options.title),
    error: options => Toast.error(options.title)
  }
})

app.use(axues)
app.mount('#app')
```

唔，看着很繁琐

### 根组件中实现

```vue
<!-- App.vue -->
<script setup>
import { Loading, Confirm, Toast, Modal } from 'my-awesome-UI-lib'
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

当然不仅是根组件，你可以在任意组件中调用，但 Axues 只会保存最后一次调用，所以建议不要在其他组件去调用 `useOverlayImplement` 方法。

我们的应用可能需要多种样式的反馈组件，那么我们的 API 也必须满足这类需求，比如我们想要配置
