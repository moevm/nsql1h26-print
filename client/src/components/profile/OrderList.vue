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
        <div
          v-for="order in visibleOrders"
          :key="order.id"
          class="order-item"
          role="button"
          tabindex="0"
          @click="goToOrder(order.id)"
          @keydown.enter="goToOrder(order.id)"
        >
          <div class="order-main">Заказ №{{ order.number }} {{ order.title }}</div>

          <div class="status-box">
            <span class="status-label">Статус: </span>
            <n-tag
              round
              :bordered="false"
              class="status-tag"
              :style="{ color: getStatusMeta(order.statusText).color }"
            >
              {{ order.statusText }}
            </n-tag>
          </div>
        </div>
        <n-button
            v-if="visibleCount < orders.length"
            class="show-more-btn"
            @click="showMore"
        >
          Показать ещё
        </n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  orders: {
    type: Array,
    default: () => []
  }
});
const router = useRouter();

const visibleCount = ref(5);

const visibleOrders = computed(() => {
  return props.orders.slice(0, visibleCount.value);
});

const showMore = () => {
  visibleCount.value += 5;
};

const goToOrder = (orderId) => {
  if (!orderId) return;
  router.push(`/orders/${orderId}`);
};

const getStatusMeta = (status) => {
  const statuses = {
    'В обработке': { color: '#6f6f6f' },
    'Принят' : { color: '#6f6f6f' },
    'Готов к выдаче' : { color: '#179c2e' },
    'Завершен' : { color: '#e10000' },
    'В процессе' : {color: '#000000'},
    'Отменен': {color: 'rgba(202,6,6,0.7)'}
  };

  return statuses[status] || { color: '#e10000', label: 'Неизвестно' };
};
</script>

<style scoped>
.orders-container {
  background-color: #D9D9D9;
  padding: 10px;
  border-radius: 30px;
  height: 100%;
  display: flex;
}

.orders-card {
  border-radius: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.orders-header {
  margin: 0 10px;
}

.orders-list {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
}

.show-more-btn {
  cursor: pointer;
  padding: 10px;
  border-radius: 30px;
  background-color: #6f6f6f;
  color: #fff;
  align-self: center;
}

.orders-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 8px;
}

:deep(.n-card-header),
:deep(.n-card__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.title {
  margin: 0;
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
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.order-item:hover {
  background: #f2f4f7;
  transform: translateY(-1px);
}

.order-item:focus-visible {
  outline: 2px solid #3355ab;
  outline-offset: 2px;
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
