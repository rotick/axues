<script setup lang="ts">
import { reactive, h } from 'vue'
import { useAxues } from 'axues'

const testConfirm = reactive(
  useAxues({
    url: '/get',
    confirmOverlay: () => ({
      style: 1,
      title: () => h('div'),
      content: '123'
    })
  })
)
</script>
<template>
  <div class="bg-card p-6 mt-6">
    <h3 class="font-semibold text-xl mb-4">Overlay components</h3>
    <button class="h-10 px-6 font-semibold rounded-md bg-primary text-white" @click="testConfirm.action()">action</button>
    <p v-if="testConfirm.pending">pending...</p>
    <div v-if="testConfirm.success">success</div>
  </div>
</template>

<style scoped></style>
