<script setup>
import { reactive } from 'vue'
import { useAxues } from 'axues'

const pagination = reactive({
  current: 0,
  pageSize: 20,
  total: 0
})
const { loading, action, data, error, retry } = useAxues({
  url: '/get',
  params: p => ({ p: pagination.current + (p || 1), s: pagination.pageSize }),
  immediate: true,
  onSuccess (data) {
    pagination.current = Number(data.args.p)
    pagination.total = 10
  }
})
</script>
<template>
  <div>
    <p v-if="loading">loading...</p>
    <p>current page: {{ pagination.current }}</p>
    <p>{{ data }}</p>
    <div v-if="error && !data">
      <p>{{ error.message }}</p>
      <button class="rounded-md bg-primary text-white" @click="retry">retry</button>
    </div>
    <button v-if="pagination.current > 1" class="h-10 px-6 font-semibold rounded-md bg-primary text-white mr-6" @click="action(-1)">prev page</button>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="action(1)">next page</button>
  </div>
</template>
