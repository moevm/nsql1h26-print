<template>
  <div class="profile-page">
    <div class="profile-layout">
      <div class="sidebar-wrapper">
        <ProfileSidebar active-tab="orders" />
      </div>

      <div class="orders-wrapper">
        <!-- Показываем состояние загрузки -->
        <div v-if="loading" class="loading-state">
          <Spinner />
          <p>Загрузка заказов...</p>
        </div>
        
        <!-- Показываем ошибку -->
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="fetchOrders">Повторить</button>
        </div>
        
        <!-- Показываем список заказов -->
        <OrderList 
          v-else
          :orders="orders"
          @filter="handleFilter"
        />
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ProfileSidebar from '../components/profile/Sidebar.vue';
import OrderList from '../components/profile/OrderList.vue';
import { useOrderStore } from '../stores/orderStore';
import { useUserStore } from '../stores/userStore';
import { ordersApi } from '../api/orders';

const route = useRoute();
const orderStore = useOrderStore();
const userStore = useUserStore();

const orders = ref([]);
const loading = ref(false);
const error = ref(null);
const filters = ref({});

const fetchOrders = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const data = await ordersApi.getUserOrders(userStore.userId, filters.value);
    orders.value = data.map(item => ({
      order_id: item.order_id,
      number: item.order_id?.slice(0, 8).toUpperCase() || 'Без номера',
      title: orderStore.mapServiceTypeText(item.service_type),
      statusText: orderStore.mapStatusText(item.status),
      date: new Date(item.created_at).toLocaleDateString(),
    }));
  } catch (err) {
    console.error('Ошибка загрузки заказов:', err);
    error.value = err.response?.data?.message || 'Не удалось загрузить заказы';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  fetchOrders();
});

const handleFilter = (newFilters) => {
  filters.value = newFilters;
  fetchOrders(); 
};


</script>

<style scoped>
.profile-page {
  padding: 32px;
  min-height: calc(100vh - 160px);
  box-sizing: border-box;
  padding-bottom: 0;
}

.profile-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
  align-items: stretch;
}

.sidebar-wrapper {
  width: 30%;
}

.orders-wrapper {
  flex: 1;
}
</style>
