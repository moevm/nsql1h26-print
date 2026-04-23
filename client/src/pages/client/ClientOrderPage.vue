<template>
  <div class="order-page">
    <div v-if="orderLoading">Загрузка...</div>
    <div v-else-if="orderError">{{ orderError }}</div>

    <div v-else-if="order">
      <div class="order-title-row">
        <button class="back-btn" type="button" @click="goBackToAccount" aria-label="Назад в личный кабинет">
          ←
        </button>
        <h1>{{ order.number }}</h1>
      </div>

      <p><strong>Статус:</strong> {{ order.statusText }}</p>
      <p><strong>Итого:</strong> {{ order.total }} руб</p>

      <hr />

      <p><strong>Тип:</strong> {{ order.type }}</p>
      <p>
        <strong>Файл: </strong>
        <a 
          v-if="order.file && order.file !== '—'"
          href="#"
          @click.prevent="viewFile"
        >
          {{ order.originalFileName || order.file }}
        </a>
        <span v-else>—</span>
      </p>
      <p><strong>Формат:</strong> {{ order.format }}</p>
      <p><strong>Комментарий:</strong> {{ order.comment }}</p>
      <p><strong>Цветность:</strong> {{ order.color }}</p>
      <p><strong>Количество:</strong> {{ order.quantity }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { useUserStore } from '@/stores/userStore';
import { ordersApi } from '@/api/orders';

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const userStore = useUserStore();

const order = computed(() => orderStore.currentOrder);
const orderLoading = computed(() => orderStore.orderLoading);
const orderError = computed(() => orderStore.orderError);

onMounted(() => {
  orderStore.fetchOrderById(route.params.id);
});

const goBackToAccount = () => {
  const userId = userStore.user?.user_id;
  if (userId) {
    router.push(`/account/${userId}`);
    return;
  }
  router.back();
};

const viewFile = async () => {
  try {
    const response = await ordersApi.getFile(route.params.id);
    
    // Создаем blob URL для просмотра
    const blob = response.data;
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Ошибка при открытии файла:', error);
  }
}
</script>

<style scoped>
.order-page {
  display: flex;
  flex-direction: column;
  padding: 0 100px 0 100px;
}

.order-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.back-btn:hover {
  background: #f3f4f6;
}
</style>
