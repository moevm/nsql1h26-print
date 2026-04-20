<template>
  <div class="home-page">
    <!-- Ждём загрузки стора -->
    <div v-if="!userLoaded" class="loading">Загрузка...</div>
    
    <!-- Для админа и сотрудника -->
    <OrdersQueue 
      v-else-if="userStore.user?.role === 'admin' || userStore.user?.role === 'employee'" 
    />
    
    <!-- Для клиента -->
    <div v-else class="client-home">
      <h1>Добро пожаловать!</h1>
      <p>Здесь будут услуги и ваши заказы</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import OrdersQueue from '@/pages/employee/OrdersQueue.vue';

const userStore = useUserStore();
const userLoaded = ref(false);

watch(
  () => userStore.user,
  (user) => {
    if (user?.role) {
      userLoaded.value = true;
      console.log('User loaded:', user.role);
    }
  },
  { immediate: true }
);

onMounted(() => {
  // Если пользователь уже загружен (из localStorage)
  if (userStore.user?.role) {
    userLoaded.value = true;
  }
});
</script>

<style scoped>
.loading {
  display: flex; justify-content: center; align-items: center;
  height: 50vh; color: #666;
}
.client-home { text-align: center; padding: 3rem; }
</style>