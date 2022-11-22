<template>
  <n-config-provider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="naiveTheme"
    :theme-overrides="naiveTheme === null ? themeOverrides : themeOverridesDark"
  >
    <n-dialog-provider>
      <n-message-provider>
        <slot />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import {
  NConfigProvider,
  zhCN,
  dateZhCN,
  NMessageProvider,
  NDialogProvider
} from 'naive-ui'
import {
  useNaiveTheme,
  themeOverrides,
  themeOverridesDark
} from './useNaiveTheme'
export default defineComponent({
  name: 'NaiveProvider',
  components: {
    NConfigProvider,
    NMessageProvider,
    NDialogProvider
  },
  setup () {
    const naiveTheme = useNaiveTheme()
    return {
      zhCN,
      dateZhCN,
      naiveTheme,
      themeOverrides,
      themeOverridesDark
    }
  }
})
</script>

<style scoped></style>
