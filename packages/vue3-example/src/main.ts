import './styles/main.css'
import { createApp } from 'vue'
import { createRouter } from './router'
import App from './App.vue'
import axios from 'axios'
import { ConfirmOverlayType, LoadingOverlayType, createAxues, SuccessOrErrorOverlayType } from 'axues'
import { useTokenAndUUID } from './hooks'
import { AuthError, NotFoundError, PermissionDeniedError } from './utils/errors'
import LRU from 'lru-cache'

const app = createApp(App)
const url = new URL(window.location.href)
const { token, UUID, removeToken } = useTokenAndUUID(url.host)

const router = createRouter()
const axiosInstance = axios.create({
  baseURL: 'https://httpbin.org/',
  timeout: 30000
})
const cacheInstance = new LRU({
  maxSize: 100000,
  // https://github.com/isaacs/node-lru-cache/issues/231
  sizeCalculation: (value: string, key: string) => {
    return value.length + key.length
  },
  ttl: 1000 * 60 * 5
})
const axues = createAxues(axiosInstance, {
  requestConfig: () => ({
    headers: {
      Authorization: token.value,
      UUID: UUID.value
    }
  }),
  responseHandle (response: any) {
    const res = response.data
    if (res.url) {
      return res
    }
    if (res.code === 401) {
      removeToken()
      router.push('/login')
      // todo create axues error, or use universal error lib, to report more error info
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
  cacheInstance,
  loadingDelay: 200,
  overlayImplement: {
    loadingOpen (options: LoadingOverlayType) {
      console.log(options)
    },
    loadingClose () {
      console.log('loadingClose')
    },
    confirm (options: ConfirmOverlayType) {
      console.log(options)
      return Promise.resolve()
    },
    success (options: SuccessOrErrorOverlayType) {
      console.log(options)
    },
    error (options: SuccessOrErrorOverlayType) {
      console.log(options)
    }
  }
})

app.use(router).use(axues)

// naive-ui style conflict
const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

app.mount('#app')
