<script setup lang="ts">
import { useAxues } from 'axues'
import { useRoute } from 'vue-router'

const status = useRoute().params.status || 200
const {
  data,
  get,
  post,
  put,
  delete: del
} = useAxues({
  url: `/status/${status}`,
  onData (data: any, newData: any, actionPayload: string) {
    if (actionPayload === 'get') {
      data.valid = newData
    }
  },
  confirmOverlay: (actionPayload: any) => actionPayload === 'delete' && 'are you sure to delete it?',
  loadingOverlay: true,
  successOverlay: (actionPayload: string, data: any) => {
    const msgMap = {
      create: `${data.title} created`,
      update: 'update success'
    }
    // @ts-expect-error
    return msgMap[actionPayload]
  },
  errorOverlay: (actionPayload: any, err: Error) => `something went wrong: ${err.message}`
})
get()
</script>
<template>
  <div>
    <div>{{ data }}</div>
    <button @click="get(null, 'get')">get</button>
    <button @click="post({ title: 'new article' }, 'create')">post</button>
    <button @click="put({ title: 'rename title' }, 'update')">put</button>
    <button @click="del(null, 'delete')">delete</button>
  </div>
</template>
<style scoped></style>
