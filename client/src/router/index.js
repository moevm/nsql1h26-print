import {createRouter, createWebHistory } from 'vue-router';
import OrderPage from "../pages/client/ClientOrderPage.vue";
import { useUserStore } from '@/stores/userStore';

// Массив маршрутов для приложения
const routes = [
  {
    path: '/',
    component: () => import('@/layout/DefaultLayout.vue'),
    children: [
      {
        path: '', 
        name: 'home',
        component: () => import('@/pages/HomePage.vue'),
      },
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
      {
        path: '/order/new/:service_type',
        name: 'order',
        component: () => import('@/pages/CreateOrderPage.vue'),
        props: true  
      },
      }
        path: '/account/:id',
        name: 'profile',
        component: () => import('@/pages/ProfilePage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/account/:id/data',
        name: 'profile-data',
        component: () => import('@/pages/ProfileDataPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: "/orders/:id",
        name: "order",
        component: () => import('@/pages/OrderPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('@/pages/admin/UsersList.vue'),
        beforeEnter: requireAdmin,
        meta: { requiresAuth: true }
      }
    ],
  },
  {
    path: '/employee',
    name: 'EmployeeOrders',
    component: () => import('@/pages/employee/OrdersQueue.vue'),
    meta: { 
      requiresAuth: true,
      requiresEmployee: true 
    }
  },
];

// Создание экземпляра маршрутизатора
export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _, next) => {
  const userStore = useUserStore();
  
  // Проверяем, требует ли маршрут авторизации
  if (to.meta.requiresAuth) {
    if (!userStore.isAuthenticated) {
      // Не авторизован - отправляем на логин
      return next({ 
        name: 'login', 
        query: { redirect: to.fullPath } 
      });
    }
    
    // Проверяем роль для employee маршрутов
    if (to.meta.requiresEmployee && 
        userStore.user?.role !== 'employee' && 
        userStore.user?.role !== 'admin') {
      return next({ name: 'home' });
    }
  }
  
  next();
});
