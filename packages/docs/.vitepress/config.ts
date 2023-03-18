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
      text_zh: '使用指引',
      collapsed: false,
      items: [
        { text: 'Request states and methods', text_zh: '请求状态及方法', link: '/guide/request-states-and-methods' },
        { text: 'Request configuration', text_zh: '请求配置', link: '/guide/request-configuration' },
        { text: 'Global configurations', text_zh: '全局配置', link: '/guide/global-configurations' },
        // { text: 'Separate request and states', text_zh: '将请求和状态分开', link: '/guide/request-states-and-operation' },
        { text: 'Debounce', text_zh: '防抖', link: '/guide/debounce' },
        { text: 'Error retries', text_zh: '错误重试', link: '/guide/error-retries' },
        { text: 'Response caching', text_zh: '缓存请求结果', link: '/guide/response-caching' },
        { text: 'With feedback components', text_zh: '集成反馈组件', link: '/guide/with-feedback-components' },
        { text: 'Request callback', text_zh: '请求完成后的回调', link: '/guide/request-callback' },
        { text: 'Paginated queries', text_zh: '分页查询', link: '/guide/paginated-queries' },
        { text: 'Use outside of components', text_zh: '组件生命周期外使用', link: '/guide/use-outside-of-components' }
      ]
    },
    {
      text: 'Best Practices',
      text_zh: '最佳实践',
      collapsed: false,
      items: [
        { text: 'Request error handling', text_zh: '请求错误处理', link: '/guide/global-configurations' },
        { text: 'Write a full paginated list page', text_zh: '写一个完整的分页列表页', link: '/guide/request-configuration' }
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
