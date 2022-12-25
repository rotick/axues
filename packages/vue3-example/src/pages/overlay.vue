<script setup lang="ts">
import { reactive, h } from 'vue'
import { useAxues } from 'axues'

const testConfirm = reactive(
  useAxues({
    url: '/get',
    confirmOverlay: (payload: any) => ({
      style: payload.b,
      title: () => h('div'),
      content: '123'
    })
  })
)
const testLoading = reactive(
  useAxues({
    url: '/get',
    loadingOverlay: (payload: any) => ({
      style: 2,
      text: payload.a
    })
  })
)
const testSuccess = reactive(
  useAxues({
    url: '/get',
    successOverlay: (payload: any, data: any) => ({
      title: payload.a,
      content: data.url
    })
  })
)
const testError = reactive(
  useAxues({
    url: '/status/500',
    loadingOverlay: true,
    onError (err: Error) {
      console.log(err)
    },
    errorOverlay: (payload: any, err: any) => ({
      title: payload.a,
      content: err.message
    })
    // errorOverlay: {
    //   title: 'payload.a',
    //   content: 'err.message'
    // },
    // errorOverlay: 'something error'
  })
)
</script>
<template>
  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">Overlay components</h3>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="testConfirm.action({ b: 2 })">action</button>
    <p v-if="testConfirm.pending">pending...</p>
    <div v-if="testConfirm.success">success</div>
  </div>

  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">Loading components</h3>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="testLoading.action({ a: 1 })">action</button>
    <p v-if="testLoading.pending">pending...</p>
    <p v-if="testLoading.loading">loading...</p>
    <div v-if="testLoading.success">success</div>
  </div>

  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">Success components</h3>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="testSuccess.action({ a: 1 })">action</button>
    <p v-if="testSuccess.loading">loading...</p>
    <div v-if="testSuccess.success">success</div>
  </div>

  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">Error components</h3>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="testError.action({ a: 1 })">action</button>
    <p v-if="testError.loading">loading...</p>
    <div v-if="testError.success">success</div>
  </div>
</template>

<style scoped></style>
