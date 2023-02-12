import Vue, { h } from 'vue'
import './style.css'
import App from './App.vue'
import axios from 'axios'
import { createAxues } from 'axues'

const axiosInstance = axios.create({
  baseURL: 'https://httpbin.org/',
  timeout: 30000
})
const axues = createAxues(axiosInstance, {
  requestConfig: () => ({
    headers: {
      Authorization: 'foo'
    }
  })
})
Vue.use(axues.vue2Plugin)

new Vue({
  render: () => h(App)
}).$mount('#app')
