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
        <!-- Колонка 1: Печать -->
        <n-gi>
          <div class="column-stack">
            <n-card v-for="service in printServices" :key="service.service_id" :bordered="false" class="service-card">
              <div class="service-header">
                <n-text strong class="service-name">Печать</n-text>
                <div class="service-controls">
                  <n-tag v-if="service.color_mode" :type="service.color_mode === 'color' ? 'warning' : 'info'" size="small">
                    {{ service.color_mode === 'color' ? 'Цветное' : 'Ч/Б' }}
                  </n-tag>
                  <n-button v-if="isAdmin" size="small" type="primary" class="edit-btn" @click="openEditModal(service)">Изменить</n-button>
                </div>
              </div>
              <div class="service-price">{{ formatPrice(service.base_price) }} ₽ / лист</div>
            </n-card>
          </div>
        </n-gi>

        <!-- Колонка 2: Сканирование -->
        <n-gi>
          <div class="column-stack">
            <n-card v-for="service in scanServices" :key="service.service_id" :bordered="false" class="service-card">
              <div class="service-header">
                <n-text strong class="service-name">Сканирование</n-text>
                <div class="service-controls">
                  <n-tag v-if="service.color_mode" :type="service.color_mode === 'color' ? 'warning' : 'info'" size="small">
                    {{ service.color_mode === 'color' ? 'Цветное' : 'Ч/Б' }}
                  </n-tag>
                  <n-button v-if="isAdmin" size="small" type="primary" class="edit-btn" @click="openEditModal(service)">Изменить</n-button>
                </div>
              </div>
              <div class="service-price">{{ formatPrice(service.base_price) }} ₽ / лист</div>
            </n-card>
          </div>
        </n-gi>

        <!-- Колонка 3: Ризография -->
        <n-gi>
          <div class="column-stack">
            <n-card v-for="service in risoServices" :key="service.service_id" :bordered="false" class="service-card">
              <div class="service-header">
                <n-text strong class="service-name">Ризография</n-text>
                <div class="service-controls">
                  <n-tag type="success" size="small">{{ service.start_circulation }}-{{ service.end_circulation }} листов</n-tag>
                  <n-button v-if="isAdmin" size="small" type="primary" class="edit-btn" @click="openEditModal(service)">Изменить</n-button>
                </div>
              </div>
              <div class="service-price">{{ formatPrice(service.base_price) }} ₽ / лист</div>
            </n-card>
          </div>
        </n-gi>
      </n-grid>
    </n-card>

    <!-- Модалка редактирования -->
    <n-modal v-model:show="showModal" preset="dialog" :title="modalTitle" :mask-closable="false">
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top">
        
        <!-- Тип услуги (только просмотр) -->
        <n-form-item label="Тип услуги">
          <n-input 
            :value="formData.service_type === 'print' ? 'Печать' : formData.service_type === 'scan' ? 'Сканирование' : 'Ризография'" 
            disabled 
          />
        </n-form-item>
        
        <!-- Цветность (для печати/скана) -->
        <n-form-item v-if="formData.service_type !== 'risography'" label="Цветность">
          <n-input :value="formData.color_mode === 'color' ? 'Цветное' : 'Ч/Б'" disabled />
        </n-form-item>
        
        <!-- Тираж (для ризографии) -->
        <template v-if="formData.service_type === 'risography'">
          <n-form-item label="От тиража">
            <n-input-number v-model:value="formData.start_circulation" :min="1" style="width: 100%" disabled />
          </n-form-item>
          <n-form-item label="До тиража">
            <n-input-number v-model:value="formData.end_circulation" :min="1" style="width: 100%" disabled />
          </n-form-item>
        </template>
        
        <!-- Цена -->
        <n-form-item label="Цена за лист (₽)" path="base_price">
          <n-input-number 
            v-model:value="formData.base_price" 
            :min="0" 
            :step="0.5" 
            style="width: 100%" 
            placeholder="0"
          />
        </n-form-item>

        <!-- Последнее изменения -->

        <n-form-item label="Последнее изменение">
          <n-input :value="formatDate(formData.changed_at)" disabled />
        </n-form-item>
        
      </n-form>
    
      <template #action>
        <n-space justify="end">
          <n-button @click="showModal = false">Отмена</n-button>
          <n-button type="primary" @click="saveService">Сохранить</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  NCard, NText, NTag, NGrid, NGi, NAlert, NButton, NModal, NForm, NFormItem, 
  NInputNumber, NSpace, NInput 
} from 'naive-ui';
import { servicesApi } from '@/api/services';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
const allServices = ref([]);
const loading = ref(false);

const showModal = ref(false);
const modalTitle = ref('Изменить услугу');
const formRef = ref(null);
const editingService = ref(null);

const formData = ref({
  service_type: 'print',
  base_price: null,
  color_mode: 'bw',
  start_circulation: null,
  end_circulation: null
});

const rules = {
  base_price: [{
    validator: (rule, value) => {
      if (value === null || value === undefined || value === '') return new Error('Укажите цену');
      if (value < 0) return new Error('Цена не может быть отрицательной');
      return true;
    },
    trigger: ['input', 'blur']
  }]
};

const isAdmin = computed(() => userStore.user?.role === 'admin');
const printServices = computed(() => allServices.value.filter(s => s.service_type === 'print'));
const scanServices  = computed(() => allServices.value.filter(s => s.service_type === 'scan'));
const risoServices  = computed(() => allServices.value.filter(s => s.service_type === 'risography'));

const loadServices = async () => {
  loading.value = true;
  try {
    const data = await servicesApi.getAllServices();
    allServices.value = Array.isArray(data) ? data : (data.services || data.data || []);
  } catch (err) {
    console.error('Ошибка загрузки:', err);
  } finally {
    loading.value = false;
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price || 0);
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const openEditModal = (service) => {
  editingService.value = service;
  formData.value = { 
    ...service, 
    base_price: Number(service.base_price) || 0 // Гарантируем числовой тип
  };
  modalTitle.value = 'Изменить услугу';
  formRef.value?.restoreValidation();
  showModal.value = true;
};

const saveService = async () => {
  try {
    await formRef.value?.validate(); // Если ошибка, тут выбросит исключение и Naive UI покажет её под полем
    
    const payload = { ...formData.value };
    if (payload.service_type !== 'risography') {
      delete payload.start_circulation;
      delete payload.end_circulation;
    } else {
      delete payload.color_mode;
    }
    
    await servicesApi.updateService(editingService.value.service_id, payload);
    await loadServices();
    showModal.value = false;
  } catch (err) {
    console.error('Ошибка сохранения:', err); // Валидация попадёт сюда, но Naive UI уже подсветит поле
  }
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
  min-height: 140px;
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
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.service-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
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
.edit-btn {
  flex-shrink: 0;
}
.column-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>