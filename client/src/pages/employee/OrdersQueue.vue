<template>
  <div class="employee-page">
    <n-card class="orders-card">
      <template #header>
        <div class="orders-header">
          <h1 class="orders-title">Очередь заказов</h1>
        </div>
      </template>

      <n-space vertical class="filters-section">
        <!-- Поиск по номеру заказа -->
        <n-input 
            v-model:value="filters.orderId" 
            placeholder="Поиск по номеру заказа..." 
            clearable
        />
        
        <!-- Фильтр по статусу (с серым плейсхолдером) -->
        <n-select
          v-model:value="filters.status"
          placeholder="Фильтр по статусу"
          clearable
          :options="[
            { label: 'Ожидает', value: 'pending' },
            { label: 'В очереди', value: 'processing' },
            { label: 'Готов к выдаче', value: 'ready' },
            { label: 'Отменен', value: 'cancelled' },
            { label: 'Завершен', value: 'completed' }
          ]"
        />
        
        <!-- Фильтр по типу услуги (с серым плейсхолдером) -->
        <n-select
          v-model:value="filters.serviceType"
          placeholder="Тип услуги"
          clearable
          :options="[
            { label: 'Печать', value: 'print' },
            { label: 'Сканирование', value: 'scan' },
            { label: 'Ризография', value: 'risography' }
          ]"
        />
        
        <!-- Фильтр по дате (диапазон) -->
        <n-date-picker
          v-model:value="filters.dateRange"
          type="datetimerange"
          placeholder="Период создания"
          clearable
        />

        <n-input 
          v-model:value="filters.userEmail" 
          placeholder="Email клиента..." 
          clearable 
        />

        <n-select
          v-model:value="filters.colorMode"
          placeholder="Цветность"
          clearable
          :options="[
            { label: 'Цветная', value: 'color' },
            { label: 'Ч/Б', value: 'bw' }
          ]"
        />

        <n-select
          v-model:value="filters.format" 
          placeholder="Формат" 
          clearable 
          :options="[
            { label: 'A4', value: 'A4' },
            { label: 'A5', value: 'A5' }
          ]"
        />

        <n-input 
          v-model:value="filters.changedBy" 
          placeholder="ID сотрудника (изменившего статус)" 
          clearable 
        />
        
        <!-- Сортировка (не сбрасывает фильтры) -->
        <n-space justify="center">
          <n-text depth="3" style="font-size: 0.9rem">Сортировка:</n-text>
          <n-button 
            size="small" 
            :type="sortBy === 'newest' ? 'primary' : 'default'"
            @click="sortBy = 'newest'"
          >
            По новизне
          </n-button>
          <n-button 
            size="small" 
            :type="sortBy === 'type' ? 'primary' : 'default'"
            @click="sortBy = 'type'"
          >
            По типу
          </n-button>
        </n-space>
      </n-space>

      <!-- Секция "Ждут подтверждения" (теперь ПОСЛЕ фильтров) -->
      <n-space vertical v-if="pendingOrders.length">
        <n-text depth="2" class="section-label">Ждут подтверждения</n-text>
        
        <n-card 
          v-for="order in pendingOrders" 
          :key="order.order_id" 
          class="order-item"
          hoverable
          @click="viewOrder(order.order_id)"
        >
          <div class="order-row">
            <n-space justify="space-between" align="center" :wrap="false">
              <n-space vertical :size="2">
                <n-space>
                  <n-tag :type="getStatusType(order.status)" size="small">
                    {{ statusLabels[order.status] }}
                  </n-tag>
                  <n-text strong>№{{ order.order_id.slice(-4) }}</n-text>
                  <n-text depth="3">{{ getServiceType(order) }}</n-text>
                </n-space>
                <n-text depth="3" style="font-size: 13px;">
                  {{ getOrderSummary(order) }}
                </n-text>
              </n-space>
              <n-space align="center">
                <n-text depth="2">
                  {{ order.user_email?.split('@')[0] || order.user_email }}
                </n-text>
                <n-button text type="primary">Подробнее →</n-button>
              </n-space>
            </n-space>
          </div>
        </n-card>
      </n-space>

      <n-divider v-if="pendingOrders.length && otherOrders.length" />

      <!-- Остальные заказы -->
      <n-space vertical v-if="filteredOrders.length">
        <n-card 
          v-for="order in filteredOrders" 
          :key="order.order_id" 
          class="order-item"
          hoverable
          @click="viewOrder(order.order_id)"
        >
          <div class="order-row">
            <n-space justify="space-between" align="center" :wrap="false">
              <n-space vertical :size="2">
                <n-space>
                  <n-tag :type="getStatusType(order.status)" size="small">
                    {{ statusLabels[order.status] }}
                  </n-tag>
                  <n-text strong>№{{ order.order_id.slice(-4) }}</n-text>
                  <n-text depth="3">{{ getServiceType(order) }}</n-text>
                </n-space>
                <n-text depth="3" style="font-size: 13px;">
                  {{ getOrderSummary(order) }}
                </n-text>
              </n-space>
              <n-space align="center">
                <n-text depth="2">
                  {{ order.user_email?.split('@')[0] || order.user_email }}
                </n-text>
                <n-button text type="primary">Подробнее →</n-button>
              </n-space>
            </n-space>
          </div>
        </n-card>
      </n-space>

      <n-empty 
        v-if="!filteredOrders.length && !loading" 
        description="Нет заказов по заданным фильтрам" 
        class="empty-state"
      />

      <template #footer>
        <n-space justify="center" v-if="showMore">
          <n-button @click="loadMore" size="small">Показать ещё</n-button>
        </n-space>
      </template>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NText, NButton, NSpace, NTag, NInput, NDivider, NEmpty, NSelect, NDatePicker } from 'naive-ui';
import { ordersApi } from '@/api/orders';

const router = useRouter();
const orders = ref([]);
const loading = ref(false);
const sortBy = ref('newest');
const visibleCount = ref(5);

const filters = ref({
  orderId: '',
  status: null,
  serviceType: null,
  dateRange: null,
  userEmail: '',          // почта клиента
  colorMode: null,        // 'color' / 'bw'
  format: null,             // например 'A4', 'A5'
  changedBy: null         // ID сотрудника
});

// Маппинг для отображения
const statusLabels = {
  pending: 'Ожидает',
  processing: 'В очереди',
  ready: 'Готов к выдаче',
  cancelled: 'Отменен',
  completed: 'Завершен'
};
const serviceMap = {
  print: 'Печать',
  scan: 'Сканирование',
  risography: 'Ризография'
};

const getStatusType = (status) => {
  const map = { pending: 'warning', processing: 'info', ready: 'success', cancelled: 'error', completed: 'success' };
  return map[status] || 'default';
};

const getServiceType = (order) => {
  if (order.service_type) return serviceMap[order.service_type] || order.service_type;
  if (order.service_name) return serviceMap[order.service_name] || order.service_name;
  try {
    const p = typeof order.parameters === 'string' ? JSON.parse(order.parameters) : order.parameters;
    const type = p?.service_type || p?.type;
    return serviceMap[type] || type || 'Заказ';
  } catch { return 'Заказ'; }
};

const getOrderSummary = (order) => {
  const params = typeof order.parameters === 'string' ? JSON.parse(order.parameters) : order.parameters || {};
  const colorMap = { color: 'Цветн.', bw: 'Ч/Б' };
  const parts = [];
  if (params.color_mode) parts.push(colorMap[params.color_mode] || params.color_mode);
  if (params.format) parts.push(params.format);
  if (order.file_pages) parts.push(`${order.file_pages} стр.`);
  if (order.quantity) parts.push(`${order.quantity} коп.`);
  return parts.join(' – ');
};

// Загрузка с серверными фильтрами
const loadOrders = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.serviceType) params.service_type = filters.value.serviceType;
    if (filters.value.dateRange && Array.isArray(filters.value.dateRange)) {
      const [from, to] = filters.value.dateRange;
      if (from) params.dateFrom = new Date(from).toISOString();
      if (to) params.dateTo = new Date(to).toISOString();
    }
    if (filters.value.userEmail) params.user_email = filters.value.userEmail;
    if (filters.value.colorMode) params.color_mode = filters.value.colorMode;
    if (filters.value.format) params.format = filters.value.format;
    if (filters.value.changedBy) params.changed_by = filters.value.changedBy;
    if (filters.value.orderId) params.order_id = filters.value.orderId; // тоже на сервер

    const data = await ordersApi.getAll(params);
    orders.value = Array.isArray(data) ? data : (data.orders || []);
  } catch (err) {
    console.error('Failed to load orders:', err);
  } finally {
    loading.value = false;
  }
};

const pendingOrders = computed(() =>
  orders.value.filter(o => o.status?.toLowerCase().trim() === 'pending')
);

const otherOrders = computed(() =>
  orders.value.filter(o => o.status?.toLowerCase().trim() !== 'pending')
);

// Применяем сортировку и пагинацию только к «остальным» заказам
const filteredOrders = computed(() => {
  let list = [...otherOrders.value];
  if (sortBy.value === 'newest') {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sortBy.value === 'type') {
    list.sort((a, b) => getServiceType(a).localeCompare(getServiceType(b)));
  }
  return list.slice(0, visibleCount.value);
});

const showMore = computed(() => visibleCount.value < otherOrders.value.length);

// При изменении серверных фильтров перезагружаем данные и сбрасываем пагинацию
watch(
  () => [
    filters.value.status, filters.value.serviceType, filters.value.dateRange,
    filters.value.userEmail, filters.value.colorMode, filters.value.format,
    filters.value.changedBy, filters.value.orderId
  ],
  () => {
    visibleCount.value = 5;
    loadOrders();
  },
  { deep: true }
);

// При изменении поиска по номеру или сортировки сбрасываем пагинацию без перезапроса
watch(
  () => [filters.value.orderId, sortBy.value],
  () => { visibleCount.value = 5; }
);

const viewOrder = (id) => router.push(`/orders/${id}`);
const loadMore = () => { visibleCount.value += 5; };

onMounted(() => loadOrders());
</script>

<style scoped>
.employee-page {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}

.orders-card {
  max-width: 900px;
  width: 100%;
  border-radius: 15px;
  box-shadow: var(--shadow);
}

.orders-header {
  text-align: center;
}

.orders-title {
  font-size: 1.5rem;
  color: #000;
  margin: 0;
}

.section-label {
  font-weight: 600;
  padding: 0.5rem 0;
}

.order-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.order-item:hover {
  transform: translateY(-2px);
}

.order-row {
  padding: 0.25rem 0;
}

.filters-section {
  padding: 1rem 0;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.empty-state {
  padding: 2rem 0;
}
</style>
