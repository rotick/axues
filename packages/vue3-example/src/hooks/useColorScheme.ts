import { ref } from 'vue'

let followSystem = 'light'
const colorScheme = ref('light')
if (typeof window !== 'undefined') {
  followSystem = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
  colorScheme.value = localStorage.theme || followSystem
}

export function useColorScheme () {
  const setColorScheme = (mode: 'light' | 'dark' | 'system') => {
    let htmlClass = followSystem
    if (mode === 'system') {
      localStorage.removeItem('theme')
      colorScheme.value = followSystem
    } else {
      localStorage.theme = mode
      colorScheme.value = mode
      htmlClass = mode
    }
    if (htmlClass === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return {
    colorScheme,
    setColorScheme
  }
}
