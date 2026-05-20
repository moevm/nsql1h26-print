<template>
  <div class="statistics-page">
    <n-card class="stats-card">
      <template #header>
        <h1 class="stats-title">Статистика пользователей</h1>
      </template>

      <!-- ФИЛЬТРЫ ПОЛЬЗОВАТЕЛЕЙ -->
      <n-form :model="filters" label-placement="left" label-width="125" class="filters-form">
        <n-grid :cols="3" :x-gap="24">
          <n-gi>
            <n-form-item label="Роль">
              <n-select v-model:value="filters.role" :options="roleOptions" clearable placeholder="Все" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Статус">
              <n-select v-model:value="filters.active" :options="statusOptions" clearable placeholder="Все" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Тип услуги">
              <n-select v-model:value="filters.serviceType" :options="serviceTypeOptions" clearable placeholder="Все" />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-space justify="end" style="margin-top: 16px">
          <n-button secondary @click="resetFilters">Сбросить</n-button>
          <n-button type="primary" @click="loadStats">Показать статистику</n-button>
        </n-space>
      </n-form>

      <n-divider>Настройки графика эффективности</n-divider>
      <n-space align="center" wrap>
        <n-text strong>Группировка (Ось X):</n-text>
        <n-select 
          v-model:value="chartGroupBy" 
          :options="chartGroupOptions" 
          style="width: 220px" 
          @update:value="loadChartStats" 
        />
        
        <n-text strong style="margin-left: 24px">Метрика (Ось Y):</n-text>
        <n-select 
          v-model:value="chartMetric" 
          :options="chartMetricOptions" 
          style="width: 220px" 
          @update:value="loadChartStats" 
        />
        
        <n-button type="primary" @click="loadChartStats" :loading="chartLoading">Обновить график</n-button>
      </n-space>

      <!-- ГРАФИК -->
        <div class="chart-container" v-if="chartData.length">
          <div class="chart-bars">
            <div 
              v-for="(item, idx) in chartData" 
              :key="idx"
              class="chart-bar-wrapper"
            >
              <!-- Столбик -->
              <div 
                class="chart-bar"
                :style="{ height: `${Math.max(item.percent, 10)}%` }"
                :title="`${item.label}: ${item.displayValue}`"
              >
                <!-- Значение над столбиком -->
                <div class="chart-value">{{ item.displayValue }}</div>
              </div>
              <!-- Подпись под столбиком -->
              <div class="chart-label-below">{{ item.label }}</div>
            </div>
          </div>
          <div class="chart-legend">
            <n-text depth="3">
              Итого: <strong>{{ chartMetric === 'revenue' ? formatCurrency(totalChartMetric) : totalChartMetric }}</strong>
            </n-text>
          </div>
        </div>
      <n-empty v-else-if="!chartLoading" description="Нет данных для графика" class="empty-chart" />

      <!-- СТАТИСТИКА ПО ЗАКАЗАМ -->
      <n-divider>Статистика по заказам</n-divider>

      <n-grid :cols="2" :x-gap="24" v-if="!statsLoading && ordersStats.byStatus.length">
        <n-gi>
          <n-card title="Заказы по статусам">
            <div class="mini-chart">
              <div v-for="(item, idx) in ordersStats.byStatus" :key="idx" class="mini-bar">
                <span class="mini-label">
                  {{ { pending: 'Ожидает', processing: 'В обработке', in_progress: 'В работе', ready: 'Готов', completed: 'Завершён', cancelled: 'Отменён' }[item.status] || item.status }}
                </span>
                <span class="mini-value">{{ item.count }}</span>
              </div>
            </div>
          </n-card>
        </n-gi>
        
        <n-gi>
          <n-card title="Топ-5 клиентов по тратам">
            <n-list>
              <n-list-item v-for="(client, idx) in topClients" :key="idx">
                <template #prefix>
                  <n-tag type="info" size="small">#{{ idx + 1 }}</n-tag>
                </template>
                <div>
                  <n-text strong>{{ client.name }}</n-text><br>
                  <n-text depth="3">{{ client.email }}</n-text><br>
                  <n-text type="success">{{ client.total_spent }} ₽</n-text>
                  <n-text depth="3"> ({{ client.order_count }} заказов)</n-text>
                </div>
              </n-list-item>
            </n-list>
          </n-card>
        </n-gi>
      </n-grid>

      <!-- СТАТИСТИКА ПО УСЛУГАМ -->
      <n-divider>Статистика по услугам</n-divider>
      <n-grid :cols="2" :x-gap="24" v-if="!statsLoading && ordersStats.popularity.length">
        <n-gi>
          <n-card title="Заказы по типам услуг">
            <div class="mini-chart">
              <div v-for="(item, idx) in ordersStats.popularity" :key="idx" class="mini-bar">
                <span class="mini-label">
                  {{ { print: 'Печать', scan: 'Сканирование', risography: 'Ризография' }[item.type] || item.type }}
                </span>
                <span class="mini-value">{{ item.orders }} заказов</span>
              </div>
            </div>
          </n-card>
        </n-gi>
        
        <n-gi>
          <n-card title="Доход по типам услуг">
            <div class="mini-chart">
              <div v-for="(item, idx) in ordersStats.popularity" :key="idx" class="mini-bar">
                <span class="mini-label">
                  {{ { print: 'Печать', scan: 'Сканирование', risography: 'Ризография' }[item.type] || item.type }}
                </span>
                <span class="mini-value">{{ item.revenue }} ₽</span>
              </div>
            </div>
          </n-card>
        </n-gi>
      </n-grid>

    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  NCard, NForm, NFormItem, NGrid, NGi, NSelect, NInput, NInputNumber, NDatePicker, 
  NSpace, NButton, NDivider, NText, NEmpty, useMessage, NList, NListItem, NTag
} from 'naive-ui';
import { useUserStore } from '@/stores/userStore';
import { usersApi } from '@/api/users';
import { ordersApi } from '@/api/orders';

const message = useMessage();
const userStore = useUserStore();

const filters = ref({
  role: null,
  active: null,
  serviceType: null
});

// Данные таблицы пользователей
const rawData = ref([]);
const tableData = ref([]);
const totalUsers = ref(0);
const loading = ref(false);

// Нижняя статистика (заказы, топ-клиенты)
const statsLoading = ref(false);
const ordersStats = ref({ byStatus: [], popularity: [] });
const topClients = ref([]);

// График
const chartLoading = ref(false);
const chartGroupBy = ref('employee');
const chartMetric = ref('revenue');
const chartData = ref([]);
const totalChartMetric = ref(0);

const chartGroupOptions = [
  { label: 'Сотрудники (Админы+Сотрудники)', value: 'employee' },
  { label: 'Типы услуг', value: 'service' }
];
const chartMetricOptions = [
  { label: 'Выручка (₽)', value: 'revenue' },
  { label: 'Количество заказов (шт)', value: 'count' }
];

const serviceTypeOptions = [
  { label: 'Все услуги', value: null },
  { label: 'Печать', value: 'print' },
  { label: 'Сканирование', value: 'scan' },
  { label: 'Ризография', value: 'risography' }
];

const roleOptions = [
  { label: 'Админ', value: 'admin' },
  { label: 'Сотрудник', value: 'employee' }
];
const statusOptions = [
  { label: 'Активен', value: true },
  { label: 'Деактивирован', value: false }
];

const loadStats = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.value.role) params.role = filters.value.role;
    if (filters.value.active !== null) params.deactivated = !filters.value.active;

    const data = await usersApi.getAllUsers(params);
    rawData.value = Array.isArray(data) ? data : (data.items || data.users || data.data || []);
    totalUsers.value = rawData.value.length;
    
    tableData.value = rawData.value.map(u => ({
      id: u.user_id,
      name: `${u.last_name} ${u.first_name}`,
      email: u.email,
      role: u.role === 'admin' ? 'Админ' : u.role === 'employee' ? 'Сотрудник' : 'Клиент',
      status: u.deactivated_at ? 'Деактивирован' : 'Активен',
      registered: formatDate(u.created_at),
      sum: formatCurrency(u.total_created_sum || u.total_processed_sum || 0)
    }));
        
    await loadChartStats();
  } catch (err) {
    console.error('Ошибка загрузки пользователей:', err);
    message.error('Не удалось загрузить данные');
  } finally {
    loading.value = false;
  }
};

// Загрузка нижней статистики
const loadAllStats = async () => {
  statsLoading.value = true;
  try {
    const [stats, clients] = await Promise.all([
      ordersApi.getStats(),
      ordersApi.getTopClients(5)
    ]);
    ordersStats.value = stats;
    topClients.value = clients.clients || [];
  } catch (err) {
    console.error('Ошибка загрузки статистики заказов:', err);
  } finally {
    statsLoading.value = false;
  }
};

// Загрузка графика
const loadChartStats = async () => {
  chartLoading.value = true;
  try {
    const params = {
      groupBy: chartGroupBy.value,
    };
    
    if (filters.value.role) params.role = filters.value.role;
    if (filters.value.active !== null && filters.value.active !== undefined) {
      params.deactivated = !filters.value.active;
    }
    if (filters.value.serviceType) params.serviceType = filters.value.serviceType;
    
    console.log('Запрос графика с параметрами:', params);
    const response = await ordersApi.getEmployeeStats(params);
    console.log('Ответ графика:', response);
    
    const rawList = response.data || [];
    if (!rawList.length) {
      chartData.value = [];
      totalChartMetric.value = 0;
      return;
    }

    const maxVal = Math.max(...rawList.map(item => 
      chartMetric.value === 'revenue' ? parseFloat(item.revenue) : item.order_count
    ));

    chartData.value = rawList.map(item => {
      const val = chartMetric.value === 'revenue' ? parseFloat(item.revenue) : item.order_count;
      const percent = maxVal > 0 ? (val / maxVal) * 100 : 0;
      return {
        label: item.label,
        value: val,
        percent: percent,
        displayValue: chartMetric.value === 'revenue' ? `${item.revenue} ₽` : `${item.order_count} шт.`
      };
    });

    totalChartMetric.value = rawList.reduce((acc, item) => 
      acc + (chartMetric.value === 'revenue' ? parseFloat(item.revenue) : item.order_count), 0
    );
  } catch (err) {
    console.error('Ошибка загрузки графика:', err);
    message.error('Не удалось загрузить график');
  } finally {
    chartLoading.value = false;
  }
};

// Сброс фильтров
const resetFilters = () => {
  filters.value = {
    role: null,
    active: null,
    serviceType: null
  };
  loadChartStats();
  loadStats();
};

const formatCurrency = (num) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num);
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const tableColumns = [
  { title: 'ФИО', key: 'name', width: 180 },
  { title: 'Email', key: 'email', width: 200 },
  { title: 'Роль', key: 'role', width: 100 },
  { title: 'Статус', key: 'status', width: 120 },
  { title: 'Регистрация', key: 'registered', width: 150 },
  { title: 'Сумма заказов', key: 'sum', width: 120, align: 'right' }
];

onMounted(() => {
  if (userStore.user?.role === 'admin') {
    loadStats();
    loadAllStats();
    loadChartStats();
  }
});
</script>

<style scoped>
.statistics-page { padding: 32px; min-height: calc(100vh - 160px); background: #f5f7fa; }
.stats-card { max-width: 1400px; margin: 0 auto; border-radius: 15px; }
.stats-title { margin: 0; font-size: 1.8rem; color: #111827; }
.filters-form { background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 24px; }
.chart-container { background: #fff; padding: 24px; border-radius: 12px; margin: 24px 0; }
.chart-bars { display: flex; align-items: flex-end; gap: 12px; height: 300px; padding: 20px 0; border-bottom: 2px solid #e5e7eb; }
.chart-label { 
  font-size: 11px; 
  color: #fff; 
  text-align: center; 
  padding: 8px 4px 4px; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  width: 100%;
}
.chart-legend { text-align: center; padding-top: 16px; }
.empty-chart { padding: 40px 0; }
.mini-chart { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
.mini-bar { 
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: #f8f9fa; border-radius: 8px;
}
.mini-label { font-size: 14px; color: #333; }
.mini-value { font-weight: 600; color: #3355ab; }
.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
  gap: 8px;
  height: 100%;
  justify-content: flex-end;
}

.chart-bar {
  width: 100%;
  max-width: 50px;
  background: linear-gradient(to top, #3355ab, #5478e8);
  border-radius: 8px 8px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  transition: all 0.2s;
  position: relative;
  min-height: 10px; /* чтобы даже 0% был виден */
}

.chart-bar:hover {
  background: linear-gradient(to top, #2a4a99, #4668d4);
  transform: translateY(-2px);
}

.chart-value {
  position: absolute;
  top: -22px;
  font-weight: 600;
  color: #111827;
  background: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.chart-label-below {
  font-size: 10px;
  color: #666;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  max-width: 80px;
  line-height: 1.2;
}
</style>