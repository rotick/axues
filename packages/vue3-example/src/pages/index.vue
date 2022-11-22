<script setup lang="ts">
import { ref } from 'vue'
import { useCRUD } from '@rotick/vue-crud'
import { NButton } from 'naive-ui'

const abc = ref('123')
const request = useCRUD()

</script>

<template>
  <div class="text-2xl">
    index{{ abc }}
    <n-button>button</n-button>
  </div>
</template>
