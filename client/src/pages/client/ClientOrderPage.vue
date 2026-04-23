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
      <p><strong>Дата оформления:</strong> {{ formatDate(order.created_at) }}</p>
      <p><strong>Статус:</strong> {{ order.statusText }}</p>
      <p><strong>Итого:</strong> {{ order.total }} руб</p>

      <hr />

      <p><strong>Тип:</strong> {{ order.type }}</p>
      <p>
        <strong>Файл: </strong>
        <a 
          v-if="order.file_name && order.file_name !== '—'"
          href="#"
          @click.prevent="viewFile"
        >
          {{ order.file_name }}
        </a>
        <span v-else>—</span>
      </p>
      <p><strong>Формат:</strong> {{ order.format }}</p>
      <p><strong>Количество страниц:</strong> {{ order.file_pages }}</p>
      <p><strong>Комментарий:</strong> {{ order.notes }}</p>
      <p><strong>Цветность:</strong> {{ order.color }}</p>
      <p><strong>Количество копий:</strong> {{ order.quantity }}</p>
      <p v-if="order.service_type === 'scan'">
        <strong>Качество скана:</strong> {{ order.quality }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { useUserStore } from '@/stores/userStore';
import { ordersApi } from '@/api/orders';

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const userStore = useUserStore();

const order = ref(null);
const orderLoading = ref(false);
const orderError = ref(null);

onMounted(async () => {
    orderLoading.value = true;
    orderError.value = null;
    
    try {
      const data = await ordersApi.getById(route.params.id);
      order.value = {
        ...data,
        number: `Заказ №${data.order_id.slice(0, 8).toUpperCase()}`,
        statusText: orderStore.mapStatusText(data.status),
        type: orderStore.mapServiceTypeText(data.service_type),
        total: Number(data.total_amount || 0),
        file_name: data.file_name || '—',
        quantity: data.quantity || 0,
        notes: data.notes || '—',
        format: orderStore.getParamValue(data.parameters, ['format', 'page_format']),
        color: orderStore.mapColorModeText(
            orderStore.getParamValue(data.parameters, ['color_mode', 'colorMode', 'color'])
        ),
        quality: orderStore.mapScanQualityText(orderStore.getParamValue(data.parameters, ['quality', 'quality']))
      };
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error);
      orderError.value = error.response?.data?.message || 'Не удалось загрузить заказ';
    } finally {
      orderLoading.value = false;
    }
});

const goBackToAccount = () => {
  const userId = userStore.user?.user_id;
  if (userId) {
    router.push(`/account/${userId}`);
    return;
  }
  router.back();
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ru-RU');
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
