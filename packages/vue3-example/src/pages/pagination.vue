<script setup>
import { reactive } from 'vue'
import { useAxues } from 'axues'

const pagination = reactive({
  current: 0,
  pageSize: 20,
  total: 0
})
const { loading, action, data } = useAxues({
  url: '/api/pagination',
  params: p => ({ p: pagination.current + p, s: pagination.pageSize }),
  immediate: true,
  onSuccess (data) {
    pagination.current = data.current
    pagination.total = data.total
  }
})
</script>
<template>
  <div>
    <p v-if="loading">loading...</p>
    <p>current page: {{ pagination.current }}</p>
    <p>{{ data }}</p>
    <button v-if="pagination.current > 1" @click="action(-1)">prev page</button>
    <button @click="action(1)">next page</button>
  </div>
</template>
