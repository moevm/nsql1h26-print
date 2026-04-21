<template>
  <n-layout-header bordered class="header">
    <div class="header-container">
      <div class="logo">
        <n-text strong class="logo-text">
          Полиграфический центр
        </n-text>
      </div>

      <div class="nav">
        <n-menu
        v-model:value="activeTab"
        mode="horizontal"
        :options="menuOptions"
        @update:value="handleMenuSelect"
        />
      </div>

      <div class="auth-buttons">
        <template v-if="!userStore.isAuthenticated">
          <n-button type="primary" @click="handleLogin">
            Вход
          </n-button>
          <n-button type="primary" @click="handleRegister">
            Регистрация
          </n-button>
        </template>

        <template v-else>
          <n-button type="primary" @click="goToAccount">
            Кабинет
          </n-button>
          <n-button type="primary" @click="handleLogout">
            Выйти
          </n-button>
        </template>
      </div>
    </div>
  </n-layout-header>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NLayoutHeader, NMenu, NButton, NText } from 'naive-ui'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref('home')

const menuOptions = computed(() => {
  const baseOptions = [
    { label: 'Главная', key: 'home' },
    { label: 'Цены', key: 'prices' }
  ]
  
  if (userStore.user?.role === 'admin') {
    baseOptions.push({ label: 'Пользователи', key: 'admin-users' })
  }
  
  return baseOptions
})

// Обработка выбора пункта меню
const handleMenuSelect = (key) => {
  if (key === 'home') {
    router.push('/')
  } else if (key === 'prices') {
    router.push('/prices')
  } else if (key === 'admin-users') { 
    router.push('/admin/users')
  }
}

const handleLogin = () => router.push('/login')
const handleRegister = () => router.push('/register')

const goToAccount = () => {
  const userId = userStore.user?.user_id;
  if (userId) {
    router.push(`/account/${userId}`);
  } else {
    router.push('/login');
  }
}

const handleLogout = async () => {
  await userStore.logout()
  // userStore.logout уже делает редирект на /login
}

const syncActiveTab = () => {
  if (route.path === '/') {
    activeTab.value = 'home'
  } else if (route.path === '/prices') {
    activeTab.value = 'prices'
  } else if (route.path === '/admin/users') {
    activeTab.value = 'admin-users'
  }
}

// Следим за изменением маршрута
watch(() => route.path, () => {
  syncActiveTab()
}, { immediate: true })

</script>
<style scoped>
.header {
  background-color: var(--secondary-color);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-container {
  margin: 0 auto;
  padding: 0 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 9vh;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
}

.nav :deep(.n-menu) {
  background: transparent;
}

.nav :deep(.n-menu-item-content) {
  font-size: 16px;
  font-weight: 500;
  padding: 0 20px;
}

.auth-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

</style>
