<template>
  <div class="order-detail-page">
    <n-card class="order-card">
      <template #header>
        <div class="order-header">
          <n-space justify="space-between" align="center">
            <n-button text type="primary" @click="$router.back()">
              ← Назад
            </n-button>
            <n-space>
              <n-text strong>Заказ №{{ order?.order_id?.slice(-4) }}</n-text>
              <n-tag :type="getStatusType(order?.status)" size="medium">
                {{ statusLabels[order?.status] }}
              </n-tag>
            </n-space>
          </n-space>
        </div>
      </template>

      <n-space vertical class="actions-section" v-if="order">
        <n-space wrap>
          <n-button 
            v-if="canAccept" 
            type="success" 
            @click="openConfirm('processing', 'Принять заказ в работу?')"
          >
            Принять
          </n-button>
          <n-button 
            v-if="canReady" 
            type="warning" 
            @click="openConfirm('ready', 'Отметить как «Готов к выдаче»?')"
          >
            Готов к выдаче
          </n-button>
          <n-button 
            v-if="canComplete" 
            type="info" 
            @click="openConfirm('completed', 'Завершить заказ?\nЭто действие нельзя отменить.')"
          >
            Завершить
          </n-button>
          <n-button 
            v-if="canCancel" 
            type="error" 
            @click="showCancelModal = true"
          >
            Отменить
          </n-button>

          <n-divider vertical />
          <n-button 
            v-if="canRevertToPending" 
            secondary 
            @click="openConfirm('pending', 'Вернуть статус в «Ожидает»?\nЗаказ снова появится в очереди.')"
          >
            ← В ожидание
          </n-button>
          <n-button 
            v-if="canRevertToProcessing" 
            secondary 
            @click="openConfirm('processing', 'Вернуть статус в «В работе»?')"
          >
            ← В работу
          </n-button>

          <n-divider vertical />
          <n-button 
            v-if="canRevertFromCancelled" 
            secondary 
            type="warning"
            @click="openConfirm('pending', 'Возобновить заказ из отмены?\nСтатус изменится на «Ожидает».')"
          >
            ↺ Возобновить (отмена)
          </n-button>
          <n-button 
            v-if="canRevertFromCompleted" 
            secondary 
            type="info"
            @click="openConfirm('ready', 'Возобновить заказ из завершения?\nСтатус изменится на «Готов к выдаче».')"
          >
            ↺ Возобновить (завершён)
          </n-button>
        </n-space>
      </n-space>

      <n-spin :show="loading" description="Загрузка...">
        <n-grid :cols="1" :x-gap="16" :y-gap="16" v-if="order">
          <n-gi>
            <n-card size="small" title="Информация о заказе">
              <div class="info-list">
                <div class="info-row">
                  <span class="info-label">Тип услуги:</span>
                  <span class="info-value">{{ getServiceType(order) }}</span>
                </div>
                <div class="info-row" v-if="params.format">
                  <span class="info-label">Формат:</span>
                  <span class="info-value">{{ params.format }}</span>
                </div>
                <div class="info-row" v-if="params.color">
                  <span class="info-label">Цветность:</span>
                  <span class="info-value">{{ params.color }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Количество копий:</span>
                  <span class="info-value">{{ toNumber(order.quantity) }}</span>
                </div>
              </div>
            </n-card>
          </n-gi>
          
          <n-gi>
            <n-card size="small" title="Файл">
              <div class="info-list">
                <div class="info-row">
                  <span class="info-label">Файл: </span>
                  <span class="info-value">
                    <template v-if="order.file_name && order.file_name !== '—'">
                        <a 
                            href="#"
                            @click.prevent="viewFile"
                            class="file-link"
                            :title="`Открыть файл ${order.file_name}`"
                        >
                            {{ order.file_name }}
                        </a>
                    </template>
                    <template v-else>
                        —
                    </template>
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Размер:</span>
                  <span class="info-value">{{ formatFileSize(order.file_size) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Количество страниц:</span>
                  <span class="info-value">{{ order.file_pages }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Комментарий:</span>
                  <span class="info-value">{{ order.notes || '—' }}</span>
                </div>
              </div>
            </n-card>
          </n-gi>
          
          <n-gi>
            <n-card size="small" title="Данные клиента">
              <div class="info-list">
                <div class="info-row" v-if="order.first_name || order.last_name">
                  <span class="info-label">ФИ:</span>
                  <span class="info-value">{{ order.last_name }} {{ order.first_name }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">{{ order.user_email || '—' }}</span>
                </div>
                <div class="info-row" v-if="order.phone">
                  <span class="info-label">Телефон:</span>
                  <span class="info-value">{{ order.phone }}</span>
                </div>
              </div>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card size="small" title="История статусов">
              <div class="history-list">
                <template v-if="order.status_history && order.status_history.length">
                  <div 
                    v-for="(item, index) in order.status_history" 
                    :key="item.history_id"
                  >
                    <div class="history-item">
                      <div class="history-status-row">
                        <n-tag :type="getStatusType(item.new_status)" size="small">
                          {{ statusLabels[item.new_status] }}
                        </n-tag>
                      </div>
                      
                      <div class="history-date-row">
                        <span class="history-date">{{ formatDate(item.changed_at) }}</span>
                      </div>
                      
                      <div class="history-details">
                        <div class="info-row">
                          <span class="info-label">Изменил:</span>
                          <span class="info-value">{{ item.user_name }}</span>
                        </div>
                        
                        <div class="info-row" v-if="item.notes && item.notes !== 'initial status'">
                          <span class="info-label">Комментарий:</span>
                          <span class="info-value">{{ item.notes }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div v-if="index !== order.status_history.length - 1" class="separator"></div>
                  </div>
                </template>
                
                <div v-else class="empty-history">
                  Нет истории изменений
                </div>
              </div>
            </n-card>
          </n-gi>
        </n-grid>
      </n-spin>

      <template #footer>
        <n-space justify="center">
          <n-text depth="3" v-if="order">
            Создан: {{ formatDate(order.created_at) }}
          </n-text>
        </n-space>
      </template>
    </n-card>

    <n-modal v-model:show="showConfirmModal" preset="dialog" :title="confirmTitle">
      <template #default>
        <n-text style="white-space: pre-line">{{ confirmText }}</n-text>
      </template>
      <template #action>
        <n-space justify="end">
          <n-button @click="showConfirmModal = false">Отмена</n-button>
          <n-button type="primary" @click="executeStatusChange">Подтвердить</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Модальное окно отмены заказа -->
    <n-modal v-model:show="showCancelModal" preset="dialog" title="Отмена заказа">
      <template #default>
        <n-space vertical>
          <n-text>Укажите причину отмены:</n-text>
          <n-input 
            v-model:value="cancelReason" 
            type="textarea" 
            placeholder="Опишите причину..." 
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </n-space>
      </template>
      <template #action>
        <n-space justify="end">
          <n-button @click="showCancelModal = false">Отмена</n-button>
          <n-button type="error" @click="cancelOrder">Подтвердить отмену</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  NCard, NText, NButton, NSpace, NTag, NGrid, NGi, NModal, NInput, NSpin, NDivider
} from 'naive-ui';
import { ordersApi } from '@/api/orders';

const route = useRoute();
const router = useRouter();
const order = ref(null);
const loading = ref(true);

const showCancelModal = ref(false);
const cancelReason = ref('');
const showConfirmModal = ref(false);
const confirmTitle = ref('');
const confirmText = ref('');
let targetStatus = '';

const toNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'object' && val !== null && 'low' in val) {
    return val.toNumber ? val.toNumber() : val.low;
  }
  return Number(val);
};

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
    ready: 'warning',
    cancelled: 'error',
    completed: 'success'
  };
  return map[status] || 'default';
};

const params = computed(() => {
  if (!order.value?.parameters) return {};
  try {
    return typeof order.value.parameters === 'string' 
      ? JSON.parse(order.value.parameters) 
      : order.value.parameters;
  } catch { return {}; }
});

const canAccept = computed(() => order.value?.status === 'pending');
const canReady = computed(() => order.value?.status === 'processing');
const canComplete = computed(() => order.value?.status === 'ready');
const canCancel = computed(() => ['pending', 'processing'].includes(order.value?.status));

const canRevertToPending = computed(() => order.value?.status === 'processing');
const canRevertToProcessing = computed(() => order.value?.status === 'ready');

const canRevertFromCancelled = computed(() => order.value?.status === 'cancelled');
const canRevertFromCompleted = computed(() => order.value?.status === 'completed');

const loadOrder = async () => {
  loading.value = true;
  try {
    const data = await ordersApi.getById(route.params.id);
    order.value =  data;
  } catch (err) {
    console.error('Failed to load order:', err);
  } finally {
    loading.value = false;
  }
};

// Открытие окна подтверждения
const openConfirm = (status, text) => {
  targetStatus = status;
  confirmTitle.value = 'Подтверждение действия';
  confirmText.value = text;
  showConfirmModal.value = true;
};

// Выполнение смены статуса
const executeStatusChange = async () => {
  showConfirmModal.value = false;
  try {
    await ordersApi.update(order.value.order_id, { status: targetStatus });
    order.value.status = targetStatus;
    await loadOrder();
  } catch (err) {
    console.error('Failed to update status:', err);
  }
};

// Отмена заказа
const cancelOrder = async () => {
  if (!cancelReason.value.trim()) return;
  try {
    await ordersApi.update(order.value.order_id, { 
      status: 'cancelled', 
      notes: cancelReason.value 
    });
    order.value.status = 'cancelled';
    await loadOrder();
    showCancelModal.value = false;
    cancelReason.value = '';
  } catch (err) {
    console.error('Failed to cancel order:', err);
  }
};

const getServiceType = (o) => {
  if (!o) return 'Заказ';
  if (o.service_type) return o.service_type;
  if (o.service_name) return o.service_name;
  if (o.parameters) {
    try {
      const p = typeof o.parameters === 'string' ? JSON.parse(o.parameters) : o.parameters;
      return p.service_type || p.type || 'Заказ';
    } catch { return 'Заказ'; }
  }
  return 'Заказ';
};

const formatFileSize = (bytes) => {
  const size = toNumber(bytes);
  if (!size && size !== 0) return '';
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / 1024 / 1024).toFixed(1) + ' MB';
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ru-RU');
};

const viewFile = async () => {
  try {
    const response = await ordersApi.getFile(route.params.id);
    
    // Создаем blob URL для просмотра
    const blob = response.data;
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Ошибка при открытии файла:', error);
  }
}

onMounted(loadOrder);
</script>

<style scoped>
.order-detail-page {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}

.order-card {
  max-width: 1000px;
  width: 100%;
  border-radius: 15px;
  box-shadow: var(--shadow);
}

.order-header {
  padding: 0.5rem 0;
}

.actions-section {
  padding: 0.5rem 0 1rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.info-label {
  font-weight: 600;
  color: var(--text-secondary, #666);
  min-width: 120px;
  flex-shrink: 0;
}

.info-value {
  color: var(--text-primary, #333);
  word-break: break-word;
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  padding: 16px 0;
}

.history-status-row {
  margin-bottom: 8px;
}

.history-date-row {
  margin-bottom: 12px;
}

.history-date {
  font-size: 12px;
  color: #6b7280;
}

.history-details {
  margin-top: 8px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  min-width: 85px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  color: #374151;
  flex: 1;
}

.separator {
  height: 1px;
  background: linear-gradient(to right, #e5e7eb, transparent);
  margin: 4px 0;
}

.empty-history {
  text-align: center;
  color: #9ca3af;
  padding: 24px;
  font-size: 14px;
}
</style>
