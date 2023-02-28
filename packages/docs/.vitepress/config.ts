import { defineConfig } from 'vitepress'
export default defineConfig({
  lang: 'en-US',
  title: 'Axues',
  description: 'Vite & Vue powered static site generator.',

  lastUpdated: true,
  cleanUrls: true,

  head: [['meta', { name: 'theme-color', content: '#1f1ab2' }]],

  markdown: {
    headers: {
      level: [0, 0]
    }
  },

  themeConfig: {
    nav: nav(),
    sidebar: {
      '/': sidebarGuide(),
      '/api/': sidebarAPI()
    },
    editLink: {
      pattern: 'https://github.com/rotick/axues/edit/main/packages/docs/:path',
      text: 'Edit this page on GitHub'
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/rotick/axues' }],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present dongnaebi'
    }
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en'
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: nav('zh'),
        sidebar: {
          '/': sidebarGuide('zh'),
          '/api/': sidebarAPI('zh')
        },
        editLink: {
          pattern: 'https://github.com/rotick/axues/edit/main/packages/docs/:path',
          text: '在 GitHub 上编辑此页'
        },
        lastUpdatedText: '最后更新于',
        docFooter: {
          prev: '上一篇',
          next: '下一篇'
        }
      }
    }
  }
})

function nav(lang?: string) {
  const arr = [
    { text: 'Guide', text_zh: '指南', link: '/introduction', link_zh: '/introduction', activeMatch: '/guide/' },
    { text: 'API', link: '/api/createAxues', activeMatch: '/api/' },
    { text: 'Changelog', text_zh: '变更记录', link: 'https://github.com/rotick/axues/blob/main/packages/axues/CHANGELOG.md' }
  ]
  if (lang === 'zh') {
    return arr.map(item => {
      return {
        ...item,
        text: item.text_zh || item.text,
        link: `/zh${item.link}`
      }
    })
  }
  return arr
}
function sidebarGuide(lang?: string) {
  const arr = [
    {
      text: 'Introduction',
      text_zh: '简介',
      collapsed: false,
      items: [
        { text: 'What is Axues?', text_zh: 'Axues 是什么？', link: '/introduction' },
        { text: 'Getting Started', text_zh: '快速上手', link: '/getting-started' }
      ]
    },
    {
      text: 'Guide',
      text_zh: '深度指引',
      collapsed: false,
      items: [
        { text: 'Basic usage', text_zh: '基础用法', link: '/guide/basic-usage' },
        { text: 'Request configuration', text_zh: '请求配置', link: '/guide/request-configuration' },
        { text: 'Debounce', text_zh: '防抖', link: '/guide/debounce' }
      ]
    }
  ]
  if (lang === 'zh') {
    return arr.map(item => {
      return {
        ...item,
        text: item.text_zh || item.text,
        items: item.items.map(child => ({
          text: child.text_zh || child.text,
          link: `/zh${child.link}`
        }))
      }
    })
  }
  return arr
}

function sidebarAPI(lang?: string) {
  const arr = [
    {
      text: 'createAxues',
      items: [{ text: 'createAxues', link: '/api/createAxues' }]
    }
  ]
  if (lang === 'zh') {
    return arr.map(item => {
      return {
        ...item,
        items: item.items.map(child => ({
          text: child.text,
          link: `/zh${child.link}`
        }))
      }
    })
  }
  return arr
}
