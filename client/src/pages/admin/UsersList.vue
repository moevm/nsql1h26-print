<template>
  <div class="admin-page">
    <n-card class="users-card">
      <template #header>
        <div class="users-header">
          <h1 class="users-title">Пользователи</h1>
          <n-text depth="3">Всего: {{ filteredUsers.length }}</n-text>
        </div>
      </template>

      <n-space vertical class="filters-section">
        <n-input v-model:value="filters.lastName" placeholder="Фамилия..." clearable />
        <n-input v-model:value="filters.firstName" placeholder="Имя..." clearable />
        <n-input v-model:value="filters.email" placeholder="Email..." clearable />
        <n-input v-model:value="filters.phone" placeholder="Телефон..." clearable />
        <n-input v-model:value="filters.userId" placeholder="ID пользователя..." clearable />
        <n-select v-model:value="filters.role" placeholder="Роль" clearable
          :options="[
            { label: 'Админ', value: 'admin' },
            { label: 'Сотрудник', value: 'employee' },
            { label: 'Клиент', value: 'client' }
          ]"
        />
        <n-select v-model:value="filters.status" placeholder="Статус" clearable
          :options="[
            { label: 'Активен', value: 'active' },
            { label: 'Деактивирован', value: 'deactivated' }
          ]"
        />
        <n-space>
          <n-date-picker v-model:value="filters.createdFrom" type="date" placeholder="С даты" clearable />
          <n-date-picker v-model:value="filters.createdTo" type="date" placeholder="По дату" clearable />
        </n-space>

      </n-space>

      <n-data-table :columns="columns" :data="visibleUsers" :loading="loading" striped bordered>
        <template #empty>
          <n-empty description="Нет пользователей по заданным фильтрам" />
        </template>
      </n-data-table>

      <n-space justify="center" class="load-more-section" v-if="showMore">
        <n-button @click="loadMore" size="large">Показать ещё</n-button>
      </n-space>
    </n-card>

    <!-- Смена роли -->
    <n-modal v-model:show="showRoleModal" preset="dialog" title="Изменение роли">
      <template #default>
        <n-space vertical>
          <n-text>Изменить роль пользователя <n-text strong>{{ targetUser?.last_name }} {{ targetUser?.first_name }}</n-text>?</n-text>
          <n-text depth="3">
            Текущая: <n-tag size="small" type="info">{{ roleLabels[targetUser?.role] }}</n-tag> → 
            Новая: <n-tag size="small" type="warning">{{ roleLabels[pendingRole] }}</n-tag>
          </n-text>
        </n-space>
      </template>
      <template #action>
        <n-space justify="end">
          <n-button @click="showRoleModal = false">Отмена</n-button>
          <n-button type="primary" @click="executeRoleChange">Подтвердить</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Деактивация/Активация -->
    <n-modal v-model:show="showStatusModal" preset="dialog" :title="pendingAction === 'deactivate' ? 'Деактивация' : 'Активация'">
      <template #default>
        <n-space vertical>
          <n-text>
            {{ pendingAction === 'deactivate' ? 'Деактивировать' : 'Активировать' }} 
            пользователя <n-text strong>{{ targetUser?.last_name }} {{ targetUser?.first_name }}</n-text>?
          </n-text>
          <n-text depth="3" v-if="pendingAction === 'deactivate'">
            Пользователь не сможет войти в систему, но его данные сохранятся.
          </n-text>
        </n-space>
      </template>
      <template #action>
        <n-space justify="end">
          <n-button @click="showStatusModal = false">Отмена</n-button>
          <n-button :type="pendingAction === 'deactivate' ? 'error' : 'success'" @click="executeStatusChange">
            {{ pendingAction === 'deactivate' ? 'Деактивировать' : 'Активировать' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, watch } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { 
  NCard, NText, NSpace, NInput, NSelect, NDataTable, NEmpty, NTag, NModal, NButton
} from 'naive-ui';
import { usersApi } from '@/api/users';

const userStore = useUserStore();
const users = ref([]);
const loading = ref(false);

const filters = ref({
  firstName: null,
  lastName: null,
  email: null,
  phone: null,
  role: null,
  status: null,
  createdFrom: null,
  createdTo: null,
  userId: null
});

// Пагинация:
const visibleCount = ref(10);

const showRoleModal = ref(false);
const showStatusModal = ref(false);
const targetUser = ref(null);
const pendingRole = ref('');
const pendingAction = ref(''); // 'deactivate' | 'activate'

const roleOptions = [
  { label: 'Админ', value: 'admin' },
  { label: 'Сотрудник', value: 'employee' },
  { label: 'Клиент', value: 'client' }
];

const roleLabels = { admin: 'Админ', employee: 'Сотрудник', client: 'Клиент' };

const isCurrentUser = (userId) => {
  const currentId = userStore.user?.user_id || userStore.user?.id;
  return userId === currentId;
};

const columns = [
  {
    title: 'ФИ',
    key: 'name',
    width: 200,
    render: (row) => `${row.last_name || ''} ${row.first_name || ''}`.trim() || '—'
  },
  {
    title: 'Email',
    key: 'email',
    ellipsis: { tooltip: true },
    width: 180
  },
  {
    title: 'Роль',
    key: 'role',
    width: 190,
    render: (row) => {
      const isSelf = isCurrentUser(row.user_id);
      return h('div', { style: 'display:flex; gap:8px; align-items:center;' }, [
        h(NSelect, {
          value: row.role,
          options: roleOptions,
          disabled: isSelf,
          size: 'small',
          style: { width: '120px' },
          onUpdateValue: (val) => handleRoleSelect(row, val)
        }),
        isSelf ? h(NText, { type: 'warning', depth: 3, size: 'small' }, { default: () => 'Вы' }) : null
      ]);
    }
  },
  {
    title: 'Статус',
    key: 'status',
    width: 130,
    render: (row) => h(NTag, {
      type: row.deactivated_at ? 'error' : 'success',
      size: 'small'
    }, { default: () => row.deactivated_at ? 'Деактивирован' : 'Активен' })
  },
  {
    title: 'Действия',
    key: 'actions',
    width: 140,
    fixed: 'right',
    render: (row) => {
      const isSelf = isCurrentUser(row.user_id);
      const isActive = !row.deactivated_at;
      return h(NButton, {
        size: 'small',
        type: isActive ? 'error' : 'success',
        disabled: isSelf,
        onClick: () => handleStatusToggle(row)
      }, { 
        default: () => isSelf ? 'Вы' : (isActive ? 'Деактивировать' : 'Активировать') 
      });
    }
  },
  {
    title: 'Зарегистрирован',
    key: 'created_at',
    width: 150,
    render: (row) => formatDate(row.created_at)
  }
];

const handleRoleSelect = (user, newRole) => {
  if (isCurrentUser(user.user_id)) return;
  targetUser.value = user;
  pendingRole.value = newRole;
  showRoleModal.value = true;
};

const handleStatusToggle = (user) => {
  if (isCurrentUser(user.user_id)) return;
  targetUser.value = user;
  pendingAction.value = user.deactivated_at ? 'activate' : 'deactivate';
  showStatusModal.value = true;
};

const executeRoleChange = async () => {
  showRoleModal.value = false;
  const user = targetUser.value;
  const newRole = pendingRole.value;

  try {
    const updatedUser = await usersApi.update(user.user_id, { role: newRole });
    const idx = users.value.findIndex(u => u.user_id === user.user_id);
    if (idx !== -1) users.value[idx] = { ...users.value[idx], ...updatedUser };
  } catch (err) {
    console.error('Failed to update role:', err);
    showRoleModal.value = false; 
  }
};

const executeStatusChange = async () => {
  showStatusModal.value = false;
  const user = targetUser.value;
  const action = pendingAction.value;

  try {
    const payload = { deactivated_at: action === 'deactivate' ? new Date().toISOString() : null };
    const updatedUser = await usersApi.update(user.user_id, payload);
    const idx = users.value.findIndex(u => u.user_id === user.user_id);
    if (idx !== -1) users.value[idx] = { ...users.value[idx], ...updatedUser };
  } catch (err) {
    console.error('Failed to update status:', err);
  }
};

const loadUsers = async () => {
  loading.value = true;
  try {
    const apiParams = {
      ...filters.value,
      created_from: filters.value.createdFrom?.toISOString(),
      created_to: filters.value.createdTo?.toISOString()
    };
    
    const data = await usersApi.getAll(apiParams);
    users.value = Array.isArray(data) ? data : (data.users || data.data || []);
  } catch (err) { console.error('Failed to load users:', err); }
  finally { loading.value = false; }
};

const matchesFilters = (user) => {
  if (filters.value.lastName && !user.last_name?.toLowerCase().includes(filters.value.lastName.toLowerCase())) return false;
  if (filters.value.firstName && !user.first_name?.toLowerCase().includes(filters.value.firstName.toLowerCase())) return false;
  if (filters.value.role && user.role !== filters.value.role) return false;
  if (filters.value.status !== null) {
    const isActive = !user.deactivated_at;
    if (filters.value.status === 'active' && !isActive) return false;
    if (filters.value.status === 'deactivated' && isActive) return false;
  }
  if (filters.value.email && !user.email?.toLowerCase().includes(filters.value.email.toLowerCase())) return false;
  if (filters.value.phone && !user.phone?.includes(filters.value.phone)) return false;
  if (filters.value.createdFrom && new Date(user.created_at) < new Date(filters.value.createdFrom)) return false;
  if (filters.value.createdTo && new Date(user.created_at) > new Date(filters.value.createdTo)) return false;
  if (filters.value.userId && user.user_id !== filters.value.userId) return false;
  return true;
};

const filteredUsers = computed(() => users.value.filter(matchesFilters));

const visibleUsers = computed(() => filteredUsers.value.slice(0, visibleCount.value));

const showMore = computed(() => visibleCount.value < filteredUsers.value.length);

watch(() => filters.value, () => { visibleCount.value = 10; }, { deep: true });

const loadMore = () => { visibleCount.value += 10; };

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

onMounted(loadUsers);
</script>

<style scoped>
.admin-page { 
  display: flex; 
  justify-content: center; 
  padding: 2rem 1rem; 
}

.users-card { 
  max-width: 1200px; 
  width: 100%; 
  border-radius: 
  15px; box-shadow: 
  var(--shadow); 
}

.users-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}

.users-title { 
  font-size: 1.5rem; 
  color: #000; 
  margin: 0; 
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

.load-more-section {
  padding: 1.5rem 0 0.5rem;
}
</style>