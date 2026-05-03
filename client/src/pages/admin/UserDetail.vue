<template>
  <div class="user-detail-page">
    <n-card class="user-card">
      <template #header>
        <div class="user-header">
          <n-space justify="space-between" align="center">
            <n-button text type="primary" @click="$router.back()">← Назад</n-button>
            <n-space>
              <n-text strong>Пользователь</n-text>
              <n-tag :type="user.deactivated_at ? 'error' : 'success'" size="medium">
                {{ user.deactivated_at ? 'Деактивирован' : 'Активен' }}
              </n-tag>
            </n-space>
          </n-space>
        </div>
      </template>

      <!-- Кнопки действий -->
      <n-space vertical class="actions-section" v-if="user">
        <n-space wrap>
          <n-button 
            v-if="!user.deactivated_at" 
            type="error" 
            @click="openConfirm('deactivate', 'Деактивировать пользователя?')"
          >
            Деактивировать
          </n-button>
          <n-button 
            v-if="user.deactivated_at" 
            type="success" 
            @click="openConfirm('activate', 'Активировать пользователя?')"
          >
            Активировать
          </n-button>
          <n-button 
            type="primary" 
            :disabled="!isFormChanged"
            @click="saveChanges"
          >
            Сохранить изменения
          </n-button>
          <n-button secondary @click="resetForm">Отменить</n-button>
        </n-space>
      </n-space>

      <n-spin :show="loading" description="Загрузка...">
        <!-- Форма редактирования -->
        <n-form 
          v-if="user" 
          ref="formRef" 
          :model="formData" 
          label-placement="top" 
          size="large"
          class="user-form"
        >
          <n-grid :cols="2" :x-gap="24">
            <!-- ID (только просмотр) -->
            <n-gi>
              <n-form-item label="ID пользователя">
                <n-input :value="user.user_id" disabled placeholder="Не редактируется" />
              </n-form-item>
            </n-gi>

            <!-- Email (только просмотр) -->
            <n-gi>
              <n-form-item label="Email">
                <n-input :value="user.email" disabled placeholder="Не редактируется" />
              </n-form-item>
            </n-gi>

            <!-- Имя -->
            <n-gi>
              <n-form-item label="Имя" path="first_name">
                <n-input v-model:value="formData.first_name" placeholder="Введите имя" />
              </n-form-item>
            </n-gi>

            <!-- Фамилия -->
            <n-gi>
              <n-form-item label="Фамилия" path="last_name">
                <n-input v-model:value="formData.last_name" placeholder="Введите фамилию" />
              </n-form-item>
            </n-gi>

            <!-- Телефон -->
            <n-gi>
              <n-form-item label="Телефон" path="phone">
                <n-input v-model:value="formData.phone" placeholder="+7..." />
              </n-form-item>
            </n-gi>

            <!-- Роль -->
            <n-gi>
              <n-form-item label="Роль" path="role">
                <n-select 
                  v-model:value="formData.role" 
                  :options="roleOptions" 
                  placeholder="Выберите роль" 
                />
              </n-form-item>
            </n-gi>

            <!-- Статус доступа -->
            <n-gi>
              <n-form-item label="Статус доступа" path="status_ui">
                <n-select 
                  v-model:value="uiStatus" 
                  :options="statusOptions" 
                  @update:value="onStatusChange" 
                />
              </n-form-item>
            </n-gi>

            <!-- Дата регистрации -->
            <n-gi>
              <n-form-item label="Зарегистрирован">
                <n-input :value="formatDate(user.created_at)" disabled />
              </n-form-item>
            </n-gi>

            <!-- Дата деактивации (если есть) -->
            <n-gi v-if="user.deactivated_at">
              <n-form-item label="Деактивирован">
                <n-input :value="formatDate(user.deactivated_at)" disabled />
              </n-form-item>
            </n-gi>
          </n-grid>
        </n-form>
      </n-spin>

      <template #footer>
        <n-space justify="center">
          <n-text depth="3" v-if="user">
            Последнее изменение: {{ formatDate(user.changed_at || user.created_at) }}
          </n-text>
        </n-space>
      </template>
    </n-card>

    <!-- Модалка подтверждения действия -->
    <n-modal v-model:show="showConfirmModal" preset="dialog" :title="confirmTitle">
      <template #default>
        <n-text style="white-space: pre-line">{{ confirmText }}</n-text>
      </template>
      <template #action>
        <n-space justify="end">
          <n-button @click="showConfirmModal = false">Отмена</n-button>
          <n-button :type="pendingAction === 'deactivate' ? 'error' : 'success'" @click="executeAction">
            {{ pendingAction === 'deactivate' ? 'Деактивировать' : 'Активировать' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usersApi } from '@/api/users';
import { 
  NCard, NText, NButton, NSpace, NTag, NForm, NFormItem, NInput, NSelect, NGrid, NGi, NModal, NSpin 
} from 'naive-ui';

const route = useRoute();
const router = useRouter();
const formRef = ref(null);

const user = ref(null);
const loading = ref(true);
const formData = ref({});
const originalData = ref(null);

// Модалка
const showConfirmModal = ref(false);
const confirmTitle = ref('');
const confirmText = ref('');
const pendingAction = ref(''); // 'activate' | 'deactivate'
const uiStatus = ref('active');

const roleOptions = [
  { label: 'Админ', value: 'admin' },
  { label: 'Сотрудник', value: 'employee' },
  { label: 'Клиент', value: 'client' }
];

const statusOptions = [
  { label: 'Активен', value: 'active' },
  { label: 'Деактивирован', value: 'deactivated' }
];

// Синхронизация селекта с данными из БД при загрузке/обновлении
watch(() => user.value, (newUser) => {
  if (newUser) {
    uiStatus.value = newUser.deactivated_at ? 'deactivated' : 'active';
  }
});

// При смене значения в списке → открываем подтверждение
const onStatusChange = (newVal) => {
  const current = user.value?.deactivated_at ? 'deactivated' : 'active';
  if (newVal === current) return; // ничего не изменилось

  pendingAction.value = newVal === 'deactivated' ? 'deactivate' : 'activate';
  confirmTitle.value = pendingAction.value === 'deactivate' ? 'Деактивация' : 'Активация';
  confirmText.value = pendingAction.value === 'deactivate'
    ? 'Деактивировать пользователя? Он потеряет доступ к системе.'
    : 'Активировать пользователя? Доступ будет восстановлен.';
  showConfirmModal.value = true;
};

const executeAction = async () => {
  showConfirmModal.value = false;
  try {
    const isDeactivate = pendingAction.value === 'deactivate';
    
    // если деактивируем → ставим дату. Если активируем → ставим null
    const payload = { 
      deactivated_at: isDeactivate ? new Date().toISOString() : null 
    };
    
    await usersApi.update(user.value.user_id, payload);
    await loadUser(); // перезагружаем данные
  } catch (err) {
    console.error('Ошибка изменения статуса:', err);
    // При ошибке возвращаем селект в исходное состояние
    uiStatus.value = user.value?.deactivated_at ? 'deactivated' : 'active';
  }
};

// Загрузка пользователя
const loadUser = async () => {
  loading.value = true;
  try {
    const data = await usersApi.getById(route.params.id);
    user.value = data;
    formData.value = { ...data };
    originalData.value = { ...data };
  } catch (err) {
    console.error('Failed to load user:', err);
  } finally {
    loading.value = false;
  }
};

// Проверка: изменилась ли форма
const isFormChanged = computed(() => {
  if (!originalData.value) return false;
  return (
    formData.value.first_name !== originalData.value.first_name ||
    formData.value.last_name !== originalData.value.last_name ||
    formData.value.phone !== originalData.value.phone ||
    formData.value.role !== originalData.value.role
  );
});

// Сохранение изменений
const saveChanges = async () => {
  try {
    const updateData = {
      first_name: formData.value.first_name,
      last_name: formData.value.last_name,
      phone: formData.value.phone,
      role: formData.value.role
    };
    
    const updated = await usersApi.update(user.value.user_id, updateData);
    user.value = { ...user.value, ...updated };
    originalData.value = { ...updated };
    
    // Показываем уведомление (если есть useNotification)
    console.log('Пользователь обновлён');
  } catch (err) {
    console.error('Failed to update user:', err);
  }
};

// Сброс формы
const resetForm = () => {
  if (originalData.value) {
    formData.value = { ...originalData.value };
  }
};

// Открытие модалки подтверждения
const openConfirm = (action, text) => {
  pendingAction.value = action;
  confirmTitle.value = action === 'deactivate' ? 'Деактивация' : 'Активация';
  confirmText.value = text;
  showConfirmModal.value = true;
};

// Форматирование даты
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

onMounted(loadUser);
</script>

<style scoped>
.user-detail-page {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}
.user-card {
  max-width: 900px;
  width: 100%;
  border-radius: 15px;
  box-shadow: var(--shadow);
}
.user-header {
  padding: 0.5rem 0;
}
.actions-section {
  padding: 0.5rem 0 1rem;
}
.user-form {
  padding: 0 8px;
}
</style>