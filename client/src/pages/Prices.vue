<template>
  <div class="prices-page">
    <n-card class="prices-card">
      <template #header>
        <h1 class="prices-title">Прайс-лист</h1>
      </template>

      <n-alert v-if="allServices.length === 0 && !loading" type="warning" style="margin-bottom: 16px">
        Услуги не найдены. Проверьте консоль браузера.
      </n-alert>

      <n-grid :cols="3" :x-gap="24" :y-gap="24" class="services-grid">
        <n-gi v-for="service in allServices" :key="service.service_id">
          <n-card :bordered="false" class="service-card">
            <div class="service-header">
              <n-text strong class="service-name">
                {{ service.service_type === 'scan' ? 'Сканирование' : 
                   service.service_type === 'print' ? 'Печать' : 'Ризография' }}
              </n-text>
              
              <n-tag v-if="service.color_mode" 
                     :type="service.color_mode === 'color' ? 'warning' : 'info'" size="small">
                {{ service.color_mode === 'color' ? 'Цветное' : 'Ч/Б' }}
              </n-tag>
              <n-tag v-else type="success" size="small">
                {{ service.start_circulation }}-{{ service.end_circulation }} листов
              </n-tag>
            </div>
            
            <div class="service-price">
              {{ formatPrice(service.base_price) }} ₽ / лист
            </div>
          </n-card>
        </n-gi>
      </n-grid>
    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { NCard, NText, NTag, NGrid, NGi, NAlert } from 'naive-ui';
import { servicesApi } from '@/api/services';

const allServices = ref([]);
const loading = ref(false);

const loadServices = async () => {
  loading.value = true;
  try {
    const data = await servicesApi.getAllServices();
    allServices.value = Array.isArray(data) ? data : (data.services || data.data || []);
    console.log('Данные в Vue:', allServices.value);
  } catch (err) {
    console.error('Ошибка загрузки:', err);
  } finally {
    loading.value = false;
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2 
  }).format(price || 0);
};

onMounted(loadServices);
</script>

<style scoped>
.prices-page {
  padding: 32px;
  min-height: calc(100vh - 160px);
  background-color: #f5f7fa;
}
.prices-card {
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 15px;
}
.prices-title {
  margin: 0;
  font-size: 2rem;
  text-align: center;
  color: #111827;
}
.services-grid {
  margin-top: 16px;
}
.service-card {
  background: #fff;
  border-radius: 12px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.service-name {
  font-size: 1.25rem;
  color: #111827;
}
.service-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3355ab;
  text-align: center;
}
</style>