<template>
  <div class="statistics-page">
    <n-card class="stats-card">
      <template #header>
        <h1 class="stats-title">Статистика пользователей</h1>
      </template>

      <!-- Фильтры -->
      <n-form :model="filters" label-placement="left" label-width="125" class="filters-form">
        <n-grid :cols="2" :x-gap="24">
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
            <n-form-item label="Имя содержит">
              <n-input v-model:value="filters.nameContains" placeholder="Например: Иван" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Email содержит">
              <n-input v-model:value="filters.emailContains" placeholder="Например: @print" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Зарегистрирован с">
              <n-date-picker v-model:value="filters.registeredFrom" type="date" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Зарегистрирован до">
              <n-date-picker v-model:value="filters.registeredTo" type="date" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Сумма заказов от">
              <n-input-number v-model:value="filters.minSum" :min="0" placeholder="0" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Сумма заказов до">
              <n-input-number v-model:value="filters.maxSum" :min="0" placeholder="∞" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Кол-во заказов от">
              <n-input-number v-model:value="filters.minOrders" :min="0" placeholder="0" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Кол-во заказов до">
              <n-input-number v-model:value="filters.maxOrders" :min="0" placeholder="∞" />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-space justify="end" style="margin-top: 16px">
          <n-button secondary @click="resetFilters">Сбросить</n-button>
          <n-button type="primary" @click="loadStats">Показать статистику</n-button>
        </n-space>
      </n-form>

      <!-- Выбор осей -->
      <n-divider>Настройки графика</n-divider>
      <n-space align="center" wrap>
        <n-text strong>Ось X:</n-text>
        <n-select v-model:value="axisX" :options="axisOptions" style="width: 200px" />
        <n-text strong style="margin-left: 24px">Ось Y:</n-text>
        <n-select v-model:value="axisY" :options="axisOptions" style="width: 200px" />
        <n-button type="primary" @click="buildChart" :disabled="!chartData.length">Построить</n-button>
      </n-space>

      <!-- График -->
      <div class="chart-container" v-if="chartData.length">
        <div class="chart-bars">
          <div 
            v-for="(item, idx) in chartData" 
            :key="idx"
            class="chart-bar"
            :style="{ height: `${item.percent}%` }"
          >
            <div class="chart-label">{{ item.label }}</div>
            <div class="chart-value">{{ item.count }}</div>
          </div>
        </div>
        <div class="chart-legend">
          <n-text depth="3">Всего найдено: <strong>{{ totalUsers }}</strong></n-text>
        </div>
      </div>

      <!-- Статистика по заказам -->
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

      <!-- Статистика по услугам -->
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

      <!-- Индикатор загрузки -->
      <n-spin :show="statsLoading" description="Загрузка статистики..." style="margin: 24px 0" />
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  NCard, NForm, NFormItem, NGrid, NGi, NSelect, NInput, NInputNumber, NDatePicker, 
  NSpace, NButton, NDivider, NText, NEmpty, NDataTable, useMessage 
} from 'naive-ui';
import { useUserStore } from '@/stores/userStore';
import { usersApi } from '@/api/users';
import { ordersApi } from '@/api/orders';

const message = useMessage();
const userStore = useUserStore();
const loading = ref(false);

// Фильтры
const filters = ref({
  role: null,
  active: null,
  nameContains: '',
  emailContains: '',
  registeredFrom: null,
  registeredTo: null,
  minSum: null,
  maxSum: null,
  minOrders: null,
  maxOrders: null, 
});

const roleOptions = [
  { label: 'Админ', value: 'admin' },
  { label: 'Сотрудник', value: 'employee' },
  { label: 'Клиент', value: 'client' }
];

const statusOptions = [
  { label: 'Активен', value: true },
  { label: 'Деактивирован', value: false }
];

const loadAllStats = async () => {
  statsLoading.value = true;
  try {
    ordersStats.value = { byStatus: [], popularity: [] };
    topClients.value = [];

    // Загружаем статистику с бэкенда
    const [stats, clients] = await Promise.all([
      ordersApi.getStats(),
      ordersApi.getTopClients(5)
    ]);
    
    // Сохраняем данные
    ordersStats.value = stats;
    topClients.value = clients.clients || [];
    
  } catch (err) {
    console.error('Ошибка загрузки статистики:', err);
  } finally {
    statsLoading.value = false;
  }
};

// Оси графика
const axisX = ref('role');
const axisY = ref('active');

const axisOptions = [
  { label: 'Роль', value: 'role' },
  { label: 'Статус', value: 'active' },
  { label: 'Месяц регистрации', value: 'registered_month' },
  { label: 'Количество заказов', value: 'order_count_range' },
  { label: 'Потрачено (клиенты)', value: 'spent_range' },
  { label: 'Последняя активность', value: 'last_activity_month' },
  { label: 'Длина имени', value: 'name_length_range' },
  { label: 'Домен email', value: 'email_domain' }
];

// Данные
const rawData = ref([]);
const chartData = ref([]);
const tableData = ref([]);
const totalUsers = ref(0);
const ordersStats = ref({ byStatus: [], popularity: [] });
const topClients = ref([]);
const statsLoading = ref(false);

// Загрузка данных по фильтрам
const loadStats = async () => {
  loading.value = true;
  try {
    rawData.value = [];
    chartData.value = [];
    tableData.value = [];
    totalUsers.value = 0;

    const params = {};
    if (filters.value.role) params.role = filters.value.role;
    if (filters.value.active !== null) params.deactivated = !filters.value.active;
    if (filters.value.nameContains) params.name = filters.value.nameContains;
    if (filters.value.emailContains) params.email = filters.value.emailContains;
    if (filters.value.registeredFrom) params.from = new Date(filters.value.registeredFrom).toISOString();
    if (filters.value.registeredTo) params.to = new Date(filters.value.registeredTo).toISOString();
    
    if (filters.value.minSum !== null && filters.value.minSum !== undefined && filters.value.minSum !== '') {
        params.minSum = Number(filters.value.minSum);
    }
    if (filters.value.maxSum !== null && filters.value.maxSum !== undefined && filters.value.maxSum !== '') {
        params.maxSum = Number(filters.value.maxSum);
    }
    if (filters.value.minOrders !== null && filters.value.minOrders !== undefined && filters.value.minOrders !== '') {
        params.minOrders = Number(filters.value.minOrders);
    }
    if (filters.value.maxOrders !== null && filters.value.maxOrders !== undefined && filters.value.maxOrders !== '') {
        params.maxOrders = Number(filters.value.maxOrders);
    }

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
    
    message.success(`Найдено пользователей: ${totalUsers.value}`);
    buildChart();
  } catch (err) {
    console.error('Ошибка загрузки статистики:', err);
    message.error('Не удалось загрузить данные');
  } finally {
    loading.value = false;
  }
};

// Построение графика
const buildChart = () => {
  if (!rawData.value.length) return;
  
  const xKey = axisX.value;
  const yKey = axisY.value;
  
  // Группируем данные
  const groups = {};
  rawData.value.forEach(user => {
    const xVal = getXValue(user, xKey);
    const yVal = getYValue(user, yKey);
    const key = `${xVal}|${yVal}`;
    
    if (!groups[key]) {
      groups[key] = { x: xVal, y: yVal, count: 0 };
    }
    groups[key].count++;
  });
  
  // Преобразуем в массив для графика
  const items = Object.values(groups);
  const maxCount = Math.max(...items.map(i => i.count), 1);
  
  chartData.value = items.map(item => ({
    label: `${item.x} / ${item.y}`,
    count: item.count,
    percent: (item.count / maxCount) * 100
  })).sort((a, b) => b.count - a.count);
};

// Вспомогательные функции для получения значений осей
const getXValue = (user, key) => {
  switch(key) {
    case 'role':
      return { admin: 'Админ', employee: 'Сотрудник', client: 'Клиент' }[user.role] || '—';
    case 'active':
      return user.deactivated_at ? 'Деактивирован' : 'Активен';
    case 'registered_month':
      return user.created_at ? new Date(user.created_at).toLocaleString('ru-RU', { month: 'short', year: 'numeric' }) : '—';
    case 'order_count_range':
      const count = user.order_count || 0;
      if (count === 0) return '0 заказов';
      if (count < 3) return '1-2 заказа';
      if (count < 10) return '3-9 заказов';
      return '10+ заказов';
    case 'spent_range': // Только для клиентов
      const sum = user.total_created_sum || 0;
      if (sum === 0) return '0 ₽';
      if (sum < 100) return '< 100 ₽';
      if (sum < 500) return '100-499 ₽';
      if (sum < 1000) return '500-999 ₽';
      if (sum < 5000) return '1-5 тыс. ₽';
      return '5000+ ₽';
    case 'last_activity_month':
      const last = user.last_action_at || user.last_order_at || user.created_at;
      return last ? new Date(last).toLocaleString('ru-RU', { month: 'short', year: 'numeric' }) : '—';
    case 'name_length_range':
      const len = (user.first_name?.length || 0) + (user.last_name?.length || 0);
      if (len < 10) return 'Короткое имя';
      if (len < 20) return 'Среднее имя';
      return 'Длинное имя';
    case 'email_domain':
      return user.email?.includes('@') ? user.email.split('@')[1] : '—';
    default:
      return '—';
  }
};

const getYValue = (user, key) => getXValue(user, key);

// Форматирование
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatCurrency = (num) => {
  return new Intl.NumberFormat('ru-RU', { 
    style: 'currency', currency: 'RUB', maximumFractionDigits: 0 
  }).format(num);
};

const resetFilters = () => {
  filters.value = {
    role: null, active: null, nameContains: '', emailContains: '',
    registeredFrom: null, registeredTo: null, minSum: null, maxSum: null,
    minOrders: null, maxOrders: null
  };
};

// Колонки таблицы
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
.chart-bar { 
  flex: 1; 
  background: linear-gradient(to top, #3355ab, #5478e8); 
  border-radius: 8px 8px 0 0; 
  min-width: 60px; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: flex-end;
  transition: all 0.2s;
  position: relative;
}
.chart-bar:hover { background: linear-gradient(to top, #2a4a99, #4668d4); transform: translateY(-4px); }
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
.chart-value { 
  position: absolute; 
  top: -24px; 
  font-weight: 700; 
  color: #111827; 
  background: #fff; 
  padding: 2px 8px; 
  border-radius: 4px; 
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
</style>