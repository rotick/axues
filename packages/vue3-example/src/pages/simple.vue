<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import { useAxues } from 'axues'

const { loading, success, error, data, action } = useAxues({ url: '/get' })
watch(data, () => {
  console.log(data.value)
})
const test2 = reactive(useAxues({ url: '/get', immediate: true }))
const test3 = reactive(
  useAxues({
    url: '/get',
    immediate: true,
    initialData: {
      test: 1,
      response: {}
    },
    onData (data, newData) {
      data.value.response = newData
    },
    onSuccess (data) {
      console.log(data)
    }
  })
)

const debounceMode = ref('lastOnly') // todo lastOnly not as expected
const test4 = reactive(
  useAxues({
    url: '/delay/10',
    debounceMode: debounceMode.value, // todo maybeRef watch
    onSuccess (data) {
      console.log(Date.now(), data)
    }
  })
)
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
    debounceMode:
    <select v-model="debounceMode">
      <option value="firstOnly">firstOnly</option>
      <option value="lastOnly">lastOnly</option>
      <option value="none">none</option>
    </select>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="test4.action()">click me quickly</button>
    <div v-if="test4.data">{{ test4.data }}</div>
  </div>
</template>
