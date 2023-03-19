<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import { useAxues } from 'axues'

const { loading, success, error, data, action } = useAxues({ url: '/get' })
watch(data, () => {
  console.log(data.value)
})
const test2 = reactive(useAxues({ url: '/get', immediate: true }))
const test3 = reactive(
  useAxues({
    url: '/post',
    method: 'post',
    data: { a: 1 },
    contentType: 'urlEncode',
    immediate: true,
    initialData: {
      test: 1,
      response: {}
    },
    onData (data: any, newData: any) {
      data.value.response = newData as object
    },
    onSuccess (data: any) {
      console.log(data)
    }
  })
)

const test4 = reactive(
  useAxues({
    url: '/delay/10',
    debounce: true,
    onSuccess (data: any) {
      console.log(Date.now(), data)
    }
  })
)

const test5 = reactive(
  useAxues({
    url: '/status/500',
    autoRetryTimes: 3,
    autoRetryInterval: 3
  })
)
const cacheKey = ref('abc')
const test6 = reactive(
  useAxues({
    url: '/get',
    cacheKey
  })
)
const test7 = reactive(useAxues('/delay/10'))

const url = ref('/get')
const params = ref({
  test: 1
})
const headers = computed(() => ({
  foo: params.value.test
}))
const test8 = reactive(
  useAxues({
    url,
    params,
    headers,
    watch: 'headers'
  })
)
function changeTest8Url () {
  url.value = '/status/500'
}
function changeTest8Params () {
  params.value.test = 2
}
function changeTest8UrlAndParams () {
  url.value = '/status/500'
  params.value.test = 3
}
</script>

<template>
  <div class="bg-card p-6">
    <h3 class="font-semibold text-xl mb-4">Simple get request</h3>
    <p v-if="loading">loading...</p>
    <div v-if="success">{{ data }}</div>
    <p v-if="error">Something went error: {{ error.message }}</p>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="action()">execute</button>
  </div>

  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">Immediate</h3>
    <p v-if="test2.pending">pending...</p>
    <div v-if="test2.success">{{ test2.data }}</div>
    <p v-if="test2.error">Something went error: {{ test2.error.message }}</p>
  </div>

  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">InitialData</h3>
    <p v-if="test3.pending">pending...</p>
    <div v-if="test3.data">{{ test3.data }}</div>
    <p v-if="test3.error">Something went error: {{ test3.error.message }}</p>
  </div>

  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">Debounce</h3>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="test4.action()">click me quickly</button>
    <div v-if="test4.data">{{ test4.data }}</div>
  </div>

  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">Auto retry and manual retry</h3>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="test5.action()">action</button>
    <div v-if="test5.error">Something went error: {{ test5.error }}</div>
    <p v-if="test5.error">
      retryTimes: {{ test5.retryTimes }}
      <button class="rounded-md bg-primary text-white px-3" @click="test5.retry">retry now</button>
    </p>
    <p v-if="test5.retryCountdown > 0">
      {{ `will auto retry after ${test5.retryCountdown}s` }}
    </p>
    <p v-if="test5.retrying">retrying...</p>
  </div>

  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">Cache</h3>
    <select v-model="cacheKey">
      <option value="abc">abc</option>
      <option value="abc1">abc</option>
    </select>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="test6.action()">action</button>
    <button class="rounded-md bg-primary text-white px-3 ml-6" @click="test6.deleteCache()">delete cache</button>
    <p v-if="test6.pending">pending...</p>
    <div v-if="test6.success">{{ test6.data }}</div>
  </div>

  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">Abort and refresh</h3>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="test7.action()">action</button>
    <button v-if="test7.canAbort" class="rounded-md bg-primary text-white px-3 ml-6" @click="test7.abort()">abort</button>
    <button class="rounded-md bg-primary text-white px-3 ml-6" @click="test7.refresh()">refresh</button>
    <p>{{ test7.requestTimes }}</p>
    <p v-if="test7.pending">pending...</p>
    <p v-if="test7.refreshing">refreshing...</p>
    <p v-if="test7.aborted">aborted</p>
    <div v-if="test7.success">{{ test7.data }}</div>
    <div v-if="test7.error">{{ test7.error }}</div>
  </div>

  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">component</h3>
    <axues v-slot="{ pending, success: success1, data: data1, action: action1 }" url="/get">
      <p v-if="pending">pending...</p>
      <div v-if="success1">{{ data1 }}</div>
      <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="action1">execute</button>
    </axues>
  </div>

  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">Watch</h3>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="changeTest8Url">changeTest8Url</button>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="changeTest8Params">changeTest8Params</button>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="changeTest8UrlAndParams">changeTest8UrlAndParams</button>
    <div v-if="test8.data">{{ test8.data }}</div>
    <div v-if="test8.error">{{ test8.error }}</div>
  </div>
</template>
