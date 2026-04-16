<template>
  <div class="services-page">
    <n-spin :show="loading" size="large">
      <div v-if="!loading && services.length === 0" class="empty-state">
        <n-empty description="Сервисы не найдены" />
      </div>

      <div v-else class="services-grid">
        <ServiceCard
          v-for="service_type in services"
          :key="service"
          :service_type="service_type"
          @order-success="handleOrderSuccess"
        />
      </div>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { NSpin, NEmpty, useNotification } from 'naive-ui';
import ServiceCard from '@/components/services/ServiceCard.vue';
import { servicesApi } from '@/api/services';

const notification = useNotification();
const loading = ref(true);
const services = ref([]);

// Загрузка сервисов
const loadServices = async () => {
  loading.value = true;
  try {
    const data = ['print', 'scan', 'risography'];
    services.value = data;
  } catch (error) {
    console.error('Ошибка загрузки сервисов:', error);
    notification.error({
      title: 'Ошибка',
      content: 'Не удалось загрузить список услуг',
      duration: 5000,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadServices();
});
</script>

<style scoped>
.services-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.services-header {
  text-align: center;
  margin-bottom: 48px;
}

.services-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}
</style>