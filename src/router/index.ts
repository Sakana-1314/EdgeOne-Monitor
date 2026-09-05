/**
 * src/router/index.ts —— Vue Router (hash 模式，便于 EdgeOne Pages 静态部署)
 */
import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAppStore } from '../store/app';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { public: true, title: '登录' }
  },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    children: [
      { path: '', redirect: '/region' },
      { path: 'region', name: 'region', component: () => import('../views/Region.vue'), meta: { title: '地区分布' } },
      { path: 'traffic', name: 'traffic', component: () => import('../views/Traffic.vue'), meta: { title: '流量与带宽' } },
      { path: 'requests', name: 'requests', component: () => import('../views/RequestsPerformance.vue'), meta: { title: '请求与性能' } },
      { path: 'origin', name: 'origin', component: () => import('../views/Origin.vue'), meta: { title: '回源分析' } },
      { path: 'security', name: 'security', component: () => import('../views/Security.vue'), meta: { title: '安全防护' } },
      { path: 'edge-functions', name: 'edge-functions', component: () => import('../views/EdgeFunctions.vue'), meta: { title: '边缘函数' } },
      { path: 'pages', name: 'pages', component: () => import('../views/Pages.vue'), meta: { title: 'Pages 应用' } },
      { path: 'top-analysis', name: 'top-analysis', component: () => import('../views/TopAnalysis.vue'), meta: { title: 'TOP 排行' } },
      { path: ':pathMatch(.*)*', redirect: '/region' }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/region' }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
});

router.beforeEach((to) => {
  const app = useAppStore();
  if (to.meta.public) return true;
  if (!app.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  return true;
});

router.afterEach((to) => {
  const app = useAppStore();
  const title = to.meta.title ? `${to.meta.title} · ${app.siteName}` : app.siteName;
  if (typeof document !== 'undefined') document.title = title;
});

export default router;
