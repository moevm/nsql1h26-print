<template>
  <div class="orders-container">
    <n-card class="orders-card" :bordered="false">
        <div class="orders-header">
          <h2 class="title">Мои заказы</h2>
        </div>

      <n-empty
        v-if="!orders.length"
        class="orders-empty"
        description="Заказов пока нет"
        size="small"
      />

      <n-space v-else vertical size="14" class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-item">
          <div class="order-main">Заказ №{{ order.number }} {{ order.title }}</div>

          <div class="status-box">
            <span class="status-label">Статус:</span>
            <n-tag
              round
              :bordered="false"
              class="status-tag"
              :style="{ color: getStatusMeta(order.status).color }"
            >
              {{ order.statusText || getStatusMeta(order.status).label }}
            </n-tag>
          </div>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup>
defineProps({
  orders: {
    type: Array,
    default: () => []
  }
});

const getStatusMeta = (status) => {
  const statuses = {
    pending: { color: '#6f6f6f', label: 'Принят' },
    accepted: { color: '#6f6f6f', label: 'Принят' },
    ready: { color: '#179c2e', label: 'Готов к выдаче' },
    completed: { color: '#e10000', label: 'Завершен' }
  };

  return statuses[status] || { color: '#e10000', label: 'Неизвестно' };
};
</script>

<style scoped>
.orders-container {
  height: 100vh;
  background-color: #D9D9D9;
  padding: 10px;
  border-radius: 30px;
}
.orders-header {
  margin: 0 10px;
}

.orders-card {
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

:deep(.n-card-header),
:deep(.n-card__content) {
  background: #ffffff !important;
}

.title {
  margin: 0 0 20px;
  font-size: 26px;
  font-weight: 700;
  color: #111827;
}

.order-item {
  background: #f9fafb;
  border-radius: 14px;
  min-height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  margin: 20px;
}

.order-main {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.status-label {
  font-size: 14px;
  color: #6b7280;
}

.status-tag {
  font-size: 14px;
  font-weight: 600;
}
</style>
