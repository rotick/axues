import './styles/main.css'
import { createApp } from 'vue'
import { createRouter } from './router'
import App from './App.vue'
import axios from 'axios'
import { createAxues } from 'axues'
import { useTokenAndUUID } from './hooks'
import { create, NButton, NDropdown, NInput, NSelect, NSwitch } from 'naive-ui'
import { AuthError, NotFoundError, PermissionDeniedError } from './utils/errors'

const naive = create({
  components: [NButton, NDropdown, NInput, NSelect, NSwitch]
})

const app = createApp(App)
const url = new URL(window.location.href)
const { token, UUID, removeToken } = useTokenAndUUID(url.host)

const router = createRouter()
const axiosInstance = axios.create({
  baseURL: 'https://httpbin.org/',
  timeout: 30000
})
const axues = createAxues(axiosInstance, {
  requestConfig: () => ({
    headers: {
      Authorization: token.value,
      UUID: UUID.value
    }
  }),
  responseHandle (res: any) {
    if (res.code === 200) {
      return res.data
    }
    if (res.code === 401) {
      removeToken()
      router.push('/login')
      return new AuthError('need login')
    }
    if (res.code === 403) {
      return new PermissionDeniedError(res.msg)
    }
    if (res.code === 404) {
      return new NotFoundError(res.msg)
    }
    return new Error('unknown error')
  },
  loadingDelay: 200
})

app.use(router).use(axues).use(naive)

// naive-ui style conflict
const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

app.mount('#app')
