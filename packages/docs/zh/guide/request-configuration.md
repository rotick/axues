# 请求配置

## 继承于 Axios 的请求配置

Axues 基于 Axios，所以是支持 Axios 的所有请求配置的，如果还不是太了解 Axios 的请求配置，请阅读他们的 [文档](https://axios-http.com/zh/docs/req_config)

## Axues 扩展的配置

为了更好的配置 Vue 的组合式 API，提升代码的简洁性，我们在 Axios 扩展了一些请求配置：

### url

有时候我们的 url 可能会依赖于某个响应性对象，如果是过程式的语法，我们不得不将请求封装到一个方法中，每次都调用这个方法。

```javascript
const id = ref(route.params.id)
function req() {
  axios.get(`/api/user/${id.value}`)
}
```

为了解决这个问题，Axues 直接支持了传入响应性对象：

```javascript
const url = ref(`/api/user/${route.params.id}`)
const { data } = useAxues(url)
```
