<script setup lang="ts">
import { ref } from 'vue'
import { useAxues } from 'axues'

defineProps<{ msg: string }>()

const count = ref(0)

const { loading, success, error, data } = useAxues('/get', { immediate: true })
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank">create-vue</a>, the official Vue + Vite starter
  </p>
  <p>
    Install
    <a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
    in your IDE for a better DX
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
  <div>
    <h2>Composables</h2>
    <p v-if="loading">loading...</p>
    <div v-if="success">{{ data }}</div>
    <p v-if="error">Something went error: {{ error.message }}</p>
  </div>
  <div>
    <h2>Component</h2>
    <axues v-slot="{ loading: loading2, success: success2, data: data2, error: error2 }" url="/get" :immediate="true">
      <div>
        <p v-if="loading2">loading...</p>
        <div v-if="success2">{{ data2 }}</div>
        <p v-if="error2">Something went error: {{ error2.message }}</p>
      </div>
    </axues>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
