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
          type="daterange"
          placeholder="Период создания"
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
import { 
  NCard, NText, NButton, NSpace, NTag, NInput, NDivider, NEmpty, NSelect, NDatePicker
} from 'naive-ui';
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
  dateRange: null
});

const statusLabels = {
  pending: 'Ожидает',
  processing: 'В очереди',
  ready: 'Готов к выдаче',
  cancelled: 'Отменен',
  completed: 'Завершен'
};

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    processing: 'info',
    ready: 'success',
    cancelled: 'error',
    completed: 'success'
  };
  return map[status] || 'default';
};

const getOrderSummary = (order) => {
  const params =
      typeof order.parameters === 'string'
          ? JSON.parse(order.parameters)
          : order.parameters || {};

  const colorMap = {
    color: 'Цветн.',
    bw: 'Ч/Б'
  };

  const parts = [];

  if (params.color_mode) {
    parts.push(colorMap[params.color_mode] || params.color_mode);
  }

  if (params.format) {
    parts.push(params.format);
  }

  if (order.file_pages) {
    parts.push(`${order.file_pages} стр.`);
  }

  if (order.quantity) {
    parts.push(`${order.quantity} коп.`);
  }

  return parts.join(' – ');
};

const loadOrders = async () => {
  loading.value = true;
  try {
    const data = await ordersApi.getAll();
    orders.value = Array.isArray(data) ? data : (data.orders || data.data || []);
  } catch (err) {
    console.error('Failed to load orders:', err);
  } finally {
    loading.value = false;
  }
};

const pendingOrders = computed(() => {
  return orders.value.filter(o => {
    if (o.status?.toLowerCase().trim() !== 'pending') return false;
    return matchesFilters(o);
  });
});

const otherOrders = computed(() => {
  return orders.value.filter(o => {
    if (o.status?.toLowerCase().trim() === 'pending') return false;
    return matchesFilters(o);
  });
});

const matchesFilters = (order) => {
  // Поиск по номеру (подстрока, регистронезависимый)
  if (filters.value.orderId) {
    const q = filters.value.orderId.toLowerCase();
    const orderIdMatch = order.order_id?.toLowerCase().includes(q) || 
                         order.order_id?.slice(-4).includes(q);
    if (!orderIdMatch) return false;
  }
  
  // Фильтр по статусу
  if (filters.value.status && order.status?.toLowerCase().trim() !== filters.value.status) {
    return false;
  }
  
  // Фильтр по типу услуги
  if (filters.value.serviceType) {
    const orderType = getServiceType(order).toLowerCase();
    if (!orderType.includes(filters.value.serviceType.toLowerCase())) {
      return false;
    }
  }
  
  // Фильтр по дате (диапазон)
  if (filters.value.dateRange && Array.isArray(filters.value.dateRange)) {
    const [from, to] = filters.value.dateRange;
    const orderDate = new Date(order.created_at).getTime();
    if (from && orderDate < new Date(from).getTime()) return false;
    if (to && orderDate > new Date(to).getTime()) return false;
  }
  
  return true;
};

const filteredOrders = computed(() => {
  let result = [...otherOrders.value];
  
  if (sortBy.value === 'newest') {
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sortBy.value === 'type') {
    result.sort((a, b) => getServiceType(a).localeCompare(getServiceType(b)));
  }
  
  return result.slice(0, visibleCount.value);
});

const showMore = computed(() => visibleCount.value < otherOrders.value.length);

const getServiceType = (o) => {
  const serviceMap = {
    print: 'Печать',
    scan: 'Сканирование',
    risography: 'Ризография'
  };
  if (!o) return 'Заказ';
  if (o.service_type) {
    return serviceMap[o.service_type] || o.service_type;
  }
  if (o.service_name) {
    return serviceMap[o.service_name] || o.service_name;
  }
  if (o.parameters) {
    try {
      const p = typeof o.parameters === 'string'
          ? JSON.parse(o.parameters)
          : o.parameters;
      const type = p.service_type || p.type;
      return serviceMap[type] || type || 'Заказ';
    } catch {
      return 'Заказ';
    }
  }
  return 'Заказ';
};

watch(() => [filters.value.orderId, filters.value.status, filters.value.serviceType, filters.value.dateRange, sortBy.value], () => {
  visibleCount.value = 5;
}, { deep: true });

const viewOrder = (id) => router.push(`/orders/${id}`);
const loadMore = () => { visibleCount.value += 5; };

onMounted(loadOrders);
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
