<script setup lang="ts">
import axios from 'axios'
import { useAxues } from 'axues'
import { NButton } from 'naive-ui'

const { pending, action } = useAxues({
  url: '/post',
  method: 'post',
  data: {
    a: 1,
    b: 2
  },
  // sometimes you don't want to new URLSearchParams, then you can set contentType to urlEncode
  contentType: 'urlEncode'
})
axios({
  baseURL: 'https://httpbin.org/',
  url: '/post',
  method: 'post',
  data: {
    a: 1,
    b: 2
  },
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
})
</script>

<template>
  <div class="text-2xl">
    {{ pending ? 'loading' : 'loaded' }}
    <n-button @click="action">button</n-button>
  </div>
</template>
