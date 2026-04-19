<template>
  <div class="sidebar-card">
    <div class="greeting">
      <h3>
        Добро пожаловать, {{ userStore.user?.first_name || userStore.user?.email?.split('@')[0] || 'Гость' }}!
      </h3>
    </div>

    <n-space vertical size="16" class="menu-buttons">
      <n-button
        block
        strong
        round
        @click="$router.push(`/account/${userStore.user?.user_id}/data`)"
      >
        Личные данные
      </n-button>

      <n-button
        block
        strong
        round
        :type="activeTab === 'orders' ? 'default' : 'default'"
        class="active-btn"
      >
        Мои заказы
      </n-button>
    </n-space>
  </div>
</template>

<script setup>
import { useUserStore } from '../../stores/userStore';

const userStore = useUserStore();
defineProps({
  activeTab: {
    type: String,
    default: 'orders'
  }
});
</script>

<style scoped>
.sidebar-card {
  background-color: #D9D9D9;
  padding: 10px;
  border-radius: 30px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.greeting h3 {
  font-size: 20px;
  font-weight: 800;
  color: #101010;
  text-align: center;
  margin-bottom: 40px;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 44px;
}

n-button {
  background-color: #ffffff !important;
  color: #0b0b0b !important;
  border-radius: 20px;
  text-align: center;
  font-weight: bold;
  padding: 10px;
  font-size: 20px;
}

n-button:hover {
  background: #ececec;
  color: #101010;
  cursor: pointer;
}

.active-btn {
  border: 2px solid #111 !important;
}
</style>
