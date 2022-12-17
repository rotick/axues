<script setup lang="ts">
import { ref } from 'vue'
import { useAxues } from 'axues'
import { NButton } from 'naive-ui'

const abc = ref('123')
useAxues()
</script>

<template>
  <div class="text-2xl">
    index{{ abc }}
    <n-button>button</n-button>
  </div>
</template>
