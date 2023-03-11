# 集成反馈组件

反馈组件又称为交互组件，只要是对用户的操作做出反馈或者与用户有交互的组件，我们都统称为反馈组件。反馈组件是 HTTP 请求的最佳拍档，不管写什么请求，都会与它们打交道。

举个例子可能会更好理解：当我们写一个删除数据的请求时，我们需要先调用 confirm 组件让用户确认，确认之后才开始请求，在请求完成之前我们要展示 loading 组件，请求成功或失败后再调用提示类的组件告知用户才做的结果。这里我们提到了 3 类组件： confirm, loading 以及提示类组件，其实能配合请求使用的反馈组件无外乎也就这三种。

## 传统的做法

通常我们会将反馈组件的状态封装并暴露出可以直接调用的 API，这样就不用在每个页面中都去维护反馈组件的状态，我们继续用删除数据的请求来举例子：

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

既然删除操作都要经过 confirm, loading, 成功 toast 或 失败 toast，那么我们是不是可以将这些 API 也封装进请求中，只用在请求配置定义文案呢？我们来尝试将上面的例子稍加封装一下。

首先把请求方法提取出来成一个独立的文件，然后将三种类型的反馈组件逻辑也加入，且在 `request` 方法里判断，只要传了相应的参数，就调用相应的反馈组件：

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

这样封装之后，我们在组件里就只用引入并使用 `request` 方法，相比于每个组件都去写一大堆请求逻辑，大幅的简化了我们的重复代码。

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

不仅如此，我们同时也解决了未来可能更换组件库的问题，不管怎么更换，我们都只用修改 `request` 方法，一举两得！甚至我们可以引入多个组件库，通过传入不同的参数来调用不用的组件库。

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

创建 Axues 实例的配置项提供了 `overlayImplement` 配置，你需要给这个配置项传入一个包含 5 个钩子函数的对象，并在这 5 个钩子函数里实现你的组件调用逻辑。

```javascript
// main.js
import { createApp } from 'vue'
import axios from 'axios'
import { createAxues } from 'axues'
import { Loading, Confirm, Toast } from 'my-awesome-UI-lib'

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

5 个钩子函数分别是：

- loadingOpen：loading 组件弹出
- loadingClose：loading 组件被关闭
- confirm：调用 confirm 组件时，注意必须返回一个 promise 对象
- success：调用成功提示组件时
- error：调用失败提示组件时

### 根组件中实现

根组件实现方式和创建时实现很类似，只不过在组件中我们必须使用 Axues 提供的组合式函数 `useOverlayImplement` 来实现，传的值和上面一致。

```vue
<!-- App.vue -->
<script setup>
import { Loading, Confirm, Toast } from 'my-awesome-UI-lib'
import { useOverlayImplement } from 'axues'
useOverlayImplement({
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
})
</script>
<template>
  <router-view></router-view>
</template>
```

当然不仅是根组件，你可以在任意组件中调用（比如在 layout 中调用），但 Axues 只会保存最后一次调用传的钩子函数，所以建议不要在根组件或 layout 之外的其他组件去调用 `useOverlayImplement` 方法。

当然你也不要被 overlay 这个词限制住了思想，你也完全可以在根组件里实现内联的反馈组件，只用确保它们在任意组件调用都能使用即可。

## 多种样式的反馈组件

我们的应用可能需要多种样式的反馈组件，比如消息提示，有时我们要用轻提示的 toast，有时又需要弹窗提示，或者就连 toast 我们都希望有多种样式供使用。

Axues 提供了多样式的反馈组件机制，你可以在实现反馈组件时判断 options 的 style 来实现不同的样式，我们用成功提示组件来举例子（所有组件都可以这样做）：

```javascript
import { Toast, Modal } from 'my-awesome-UI-lib'
useOverlayImplement({
  success: options => (options.style === 1 ? Toast(options.title) : Modal({ title: options.title, content: options.content }))
})
```

这个例子中，我们判断了如果样式是 1，则使用 `Toast` 组件，否则就使用 `Modal` 组件。那么在调用中，我们也应该告诉 Axues 该用哪个样式：

```javascript
import { useAxues } from 'axues'

// 这个请求将使用 Toast 组件来提示
const { action } = useAxues({
  url: id => `/api/delete/${id}`,
  method: 'delete',
  successOverlay: '已删除' // 如果没有显式的传 style，默认就是 1
})

// 而这个请求将使用 Modal 组件来提示
const { action } = useAxues({
  url: id => `/api/delete/${id}`,
  method: 'delete',
  successOverlay: {
    style: 2,
    title: '已删除'
  }
})
```

## 反馈组件的多种传参方式

通过上面的例子可以看到，`successOverlay` 完整的参数应该是个对象，仅传一个字符串是它的简化写法，这个字符串将会赋值给 `options.title`。这个完整的对象是这样的：

```typescript
interface SuccessOrErrorOverlayType {
  style?: number
  title: string | (() => VNodeChild)
  content?: string | (() => VNodeChild)
  callback?: (payload?: any) => void
}
```

然而，有时我们想在这个对象里使用请求发起时的传参，或者是请求返回的数据，所以 `successOverlay` 也支持了传入一个函数，这个函数的参数分别是 `action` 的传参和请求返回的 `data`。

```javascript
import { useAxues } from 'axues'

const { action } = useAxues({
  url: id => `/api/delete/${id}`,
  method: 'delete',
  successOverlay: (style, data) => ({
    style,
    title: `已删除${data.title}`
  })
})

action(2) // style 从这里传入
```

其他的三个反馈组件也是一样的，具体每个反馈组件的传参请分别参考它们的 API：

- [confirmOverlay]()
- [loadingOverlay]()
- [successOverlay]()
- [errorOverlay]()
