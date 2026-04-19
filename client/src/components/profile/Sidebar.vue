<template>
  <div class="sidebar-card" :bordered="false">
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
  border-radius: 18px;
  overflow: hidden;
  height: 100vh;
  background-color: #D9D9D9;
  padding: 10px;
}

.greeting h3 {
  margin: 30px;
  font-size: 25px;
  line-height: 1.18;
  font-weight: 800;
  color: #101010;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
