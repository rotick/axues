import { createRouter as _createRouter, createWebHistory } from 'vue-router'
import layout from '../layout/index.vue'

export function createRouter () {
  const router = _createRouter({
    // use appropriate history implementation for server/client
    // import.meta.env.SSR is injected by Vite.
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        component: layout,
        meta: {},
        children: [
          {
            path: '',
            component: () => import('../pages/index.vue'),
            meta: { title: '首页' }
          }
        ]
      },
      {
        path: '/:pathMatch(.*)*',
        name: '404',
        component: () => import('../pages/404.vue'),
        meta: { title: '页面丢失了' }
      }
    ]
  })

  return router
}
