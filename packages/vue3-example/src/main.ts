import './styles/main.css'
import { createApp } from 'vue'
import { createRouter } from './router'
import App from './App.vue'
import { createCRUD } from '@rotick/vue-crud'
import { useTokenAndUUID } from './hooks'
import { create, NButton, NDropdown, NInput, NSelect, NSwitch } from 'naive-ui'

const naive = create({
  components: [NButton, NDropdown, NInput, NSelect, NSwitch]
})

const app = createApp(App)
const url = new URL(window.location.href)
const { token, UUID, removeToken } = useTokenAndUUID(url.host)

const router = createRouter()
const CRUD = createCRUD({
  headers: () => ({
    Authorization: token.value,
    UUID: UUID.value
  }),
  responseHandle (err: Error, res: any) {
    if (err) {
      return null
    }
    if (res.code === 200) {
      return res.data
    }
    if (res.code === 401) {
      removeToken()
      router.push('/login')
    }
    return null
  }
})

app.use(router).use(CRUD).use(naive)

// naive-ui style conflict
const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

app.mount('#app')
