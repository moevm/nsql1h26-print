import {createRouter, createWebHistory } from 'vue-router';

// Массив маршрутов для приложения
const routes = [
  {
    path: '/',
    component: () => import('@/layout/DefaultLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/pages/LoginPage.vue'),
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/pages/RegisterPage.vue'),
      },
    ],
  },
];

// Создание экземпляра маршрутизатора
export const router = createRouter({
  history: createWebHistory(),
  routes,
});