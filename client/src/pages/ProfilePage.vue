<template>
  <div class="profile-page">
    <div class="profile-layout">
      <div class="sidebar-wrapper">
        <ProfileSidebar />
      </div>

      <div class="orders-wrapper">
        <OrderList :orders="orderStore.orders" />
      </div>
    </div>
  </div>
</template>

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
  align-items: flex-start;
}

.sidebar-wrapper {
  width: 30%;
}

.orders-wrapper {
  flex: 1;
}
</style>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ProfileSidebar from '../components/profile/Sidebar.vue';
import OrderList from '../components/profile/OrderList.vue';
import { useOrderStore } from '../stores/orderStore';
import { useUserStore } from '../stores/userStore';

const route = useRoute();
const orderStore = useOrderStore();
const userStore = useUserStore();

onMounted(async () => {
  const userId = route.params.id;
  console.log('ID профиля из URL:', userId);
  await orderStore.fetchOrders();
});
</script>
