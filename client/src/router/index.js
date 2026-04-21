import {createRouter, createWebHistory } from 'vue-router';
import OrderPage from "../pages/OrderPage.vue";
import { useUserStore } from '@/stores/userStore';

const requireEmployee = (to, from, next) => {
  const userStore = useUserStore();
  
  if (!userStore.isAuthenticated || !userStore.user?.role) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }
  
  if (userStore.user.role !== 'employee' && userStore.user.role !== 'admin') {
    return next({ name: 'login' });
  }
  
  next();
};

const requireAdmin = (to, from, next) => {
  const userStore = useUserStore();
  
  if (!userStore.user || !userStore.user.role) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }
  
  if (userStore.user.role !== 'admin') {
    return next({ name: 'home' }); // на главную?
  }
  
  next();
};

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
            component: OrderPage
        }

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
    beforeEnter: requireEmployee,
    meta: { requiresAuth: true }
  },
  
  {
    path: '/order/:id',  
    name: 'OrderDetail',
    component: () => import('@/pages/employee/OrderDetail.vue'),
    beforeEnter: requireEmployee,  
    meta: { requiresAuth: true }
  }
];

// Создание экземпляра маршрутизатора
export const router = createRouter({
  history: createWebHistory(),
  routes,
});
