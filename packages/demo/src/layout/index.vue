<template>
  <naive-provider>
    <header class="sticky top-0 h-14 border-b border-divider backdrop-blur-md flex items-center justify-between px-6 z-50 shadow-sm bg-white/10 dark:bg-white/5">
      <h1 class="logo font-bold text-xl color-title">@rotick/axues</h1>
      <div class="flex items-center">
        <n-dropdown :options="themeOptions" :on-select="setColorScheme">
          <a href="javascript:;">
            <!--            <IcOutlineDarkMode v-if="colorScheme === 'dark'" />-->
            <!--            <IcTwotoneLightMode v-if="colorScheme === 'light'" />-->
          </a>
        </n-dropdown>
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </naive-provider>
</template>

<script lang="tsx">
import { defineComponent, h } from 'vue'
import { useColorScheme } from '../hooks'
import { NDropdown } from 'naive-ui'
import NaiveProvider from './components/naive-provider.vue'
import IcOutlineDarkMode from '~icons/ic/outline-dark-mode'
import IcTwotoneLightMode from '~icons/ic/twotone-light-mode'
import FluentDesktop24Regular from '~icons/fluent/desktop-24-regular'
export default defineComponent({
  name: 'Index',
  components: {
    NDropdown,
    NaiveProvider
    // todo error
    // IcOutlineDarkMode,
    // IcTwotoneLightMode
  },
  setup () {
    const { colorScheme, setColorScheme } = useColorScheme()

    const themeOptions = [
      {
        label: 'Dark',
        key: 'dark',
        icon: () => h(IcOutlineDarkMode)
      },
      {
        label: 'Light',
        key: 'light',
        icon: () => h(IcTwotoneLightMode)
      },
      {
        label: 'Follow system',
        key: 'system',
        icon: () => h(FluentDesktop24Regular)
      }
    ]

    return {
      colorScheme,
      setColorScheme,
      themeOptions
    }
  }
})
</script>

<style scoped></style>
