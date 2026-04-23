<template>
  <div class="order-page">
    <div class="order-container">
      <h2 class="order-title">Оформление заказа</h2>
      
      <!-- Форма заказа -->
      <n-form
        ref="formRef"
        :model="formData"
        label-placement="top"
        size="large"
      >
        <!-- Количество -->
        <n-form-item label="Количество" path="quantity">
          <n-input-number
            v-model:value="formData.quantity"
            :min="1"
            @update:value="onFormChange"
            style="width: 100%"
          />
        </n-form-item>

        <!-- Формат -->
        <n-form-item label="Формат" path="format">
          <n-select
            v-model:value="localParameters.format"
            :options="formatOptions"
            @update:value="onFormChange"
          />
        </n-form-item>

        <!-- Режим цвета (для scan и print) -->
        <n-form-item v-if="needsColorMode" label="Режим цвета">
          <n-radio-group v-model:value="localParameters.color" @update:value="onFormChange">
            <n-radio value="color">
              <n-space align="center">
                <span>Цветное</span>
              </n-space>
            </n-radio>
            <n-radio value="bw">
              <n-space align="center">
                <span>Черно-белое</span>
              </n-space>
            </n-radio>
          </n-radio-group>
        </n-form-item>

        <!-- Загрузка файла (для print и risography) -->
        <n-form-item v-if="needsFileUpload" label="Файл для печати">
          <n-upload
            :multiple="false"
            :max="1"
            :show-file-list="false"
            @change="handleFileUpload"
            accept=".pdf,.jpg,.jpeg,.png"
          >
            <n-button>
              Выбрать файл
            </n-button>
          </n-upload>
          
          <div v-if="uploadedFile" class="file-info">
            <n-tag closable @close="removeFile">
              {{ uploadedFile.name }} ({{ formatFileSize(uploadedFile.size) }})
            </n-tag>
          </div>
        </n-form-item>

        <!-- Качество скана -->
        <n-form-item v-if="props.service_type === 'scan'" label="Качество скана">
          <n-radio-group v-model:value="localParameters.quality" @update:value="onFormChange">
            <n-radio value="high">
              <n-space align="center">
                <span>Сохранить качество</span>
              </n-space>
            </n-radio>

            <n-radio value="compressed">
              <n-space align="center">
                <span>Сжать файл</span>
              </n-space>
            </n-radio>
          </n-radio-group>
        </n-form-item>

        <!-- Результат расчета -->
        <n-alert v-if="calculatedCost !== null && !isLoading" type="success" :bordered="false" class="cost-alert">
          <template #header>
            Стоимость: {{ calculatedCost }} руб.
          </template>
        </n-alert>

        <!-- Поле комментария (появляется после расчета) -->
        <n-form-item v-if="calculatedCost !== null && !isLoading" label="Комментарий к заказу">
          <n-input
            v-model:value="comment"
            type="textarea"
            placeholder="Дополнительные пожелания к заказу..."
            :rows="3"
            :maxlength="500"
            show-count
          />
        </n-form-item>

        <!-- Индикатор загрузки -->
        <n-spin v-if="isLoading" size="large" class="loading-spinner">
          <template #description>
            Расчет стоимости...
          </template>
        </n-spin>

        <div class="button-group">
          <n-button
            type="success"
            :disabled="!canCalculate || isLoading"
            @click="calculateCost"
            size="large"
            block
          >
            Рассчитать
          </n-button>
        <!-- Кнопка оформления заказа (появляется после расчета) -->
            <div v-if="calculatedCost !== null && !isLoading" class="order-button-group">
            <n-button
                type="primary"
                size="large"
                block
                :loading="isSubmitting"
                @click="submitOrder"
            >
                Оформить заказ
            </n-button>
            </div>
        </div>
      </n-form>
    </div>

    <!-- Модальное окно подтверждения -->
    <n-modal
      v-model:show="showConfirmModal"
      preset="dialog"
      title="Подтверждение заказа"
      content="Вы уверены, что хотите оформить заказ?"
      positive-text="Оформить"
      negative-text="Отмена"
      @positive-click="confirmOrder"
      @negative-click="cancelOrder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { PDFDocument } from 'pdf-lib';
import { ordersApi } from '@/api/orders'
import { useRoute, useRouter } from 'vue-router'
import {
  NTag,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NRadioGroup,
  NRadio,
  NSpace,
  NUpload,
  NAlert,
  NSpin,
  NInput,
  NModal,
  useNotification
} from 'naive-ui'

import { servicesApi } from '@/api/services.js'

// Props
const props = defineProps({
  service_type: {
    type: String,
    required: true,
    validator: (value: string) => ['scan', 'print', 'risography'].includes(value)
  }
})

// Router
const route = useRoute()
const router = useRouter()
const notification = useNotification()

// Refs
const uploadedFile = ref<null>(null)
const calculatedCost = ref<null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const comment = ref('')
const showConfirmModal = ref(false)
const serviceData = ref(null);
const pageCount = ref(null); 
const isCalculatingPages = ref(false);

// Функция получения количества страниц из PDF
const getPageCountFromPdf = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        const arrayBuffer = reader.result;
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPageCount();
        resolve(pages);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
// Данные формы
const formData = reactive({
  service_type: props.service_type,
  quantity: 1,
  parameters: {}
})

const localParameters = reactive({
  format: 'A4',
  color: 'color',
  quality: 'high'
})

// Опции для форматов
const formatOptions = [
  { label: 'A4', value: 'A4' },
  { label: 'A5', value: 'A5' }
]

// Computed
const needsColorMode = computed(() => 
  props.service_type === 'scan' || props.service_type === 'print'
)

const needsFileUpload = computed(() => 
  props.service_type === 'print' || props.service_type === 'risography'
)

const canCalculate = computed(() => {
  if (!formData.quantity || formData.quantity < 1) return false
  return !(needsFileUpload.value && !uploadedFile.value);

})

// Methods
const updateParameters = () => {
  const params: any = { format: localParameters.format }
  if (needsColorMode.value) {
    params.color = localParameters.color
  }

  if (props.service_type === 'scan') {
    params.quality = localParameters.quality
  }

  formData.parameters = params
}

const onFormChange = () => {
  calculatedCost.value = null
  comment.value = ''
  updateParameters()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleFileUpload = async (options) => {
  const file = options.file.file;
  if (file) {
    uploadedFile.value = file;
    pageCount.value = null;
    
    // Проверяем, что это PDF
    if (file.type === 'application/pdf') {
      isCalculatingPages.value = true;
      try {
        const pages = await getPageCountFromPdf(file);
        pageCount.value = pages;
        console.log('Количество страниц:', pages);
        
        notification.success({
          title: 'PDF загружен',
          content: `Количество страниц: ${pages}`,
          duration: 3000
        });
      } catch (error) {
        console.error('Ошибка чтения PDF:', error);
        notification.error({
          title: 'Ошибка',
          content: 'Не удалось прочитать PDF файл',
          duration: 5000
        });
      } finally {
        isCalculatingPages.value = false;
      }
    } else {
      // Для изображений
      console.log('Загружено изображение:', file.name);
      pageCount.value = 1;
    }
    onFormChange();
  }
};

const removeFile = () => {
  uploadedFile.value = null
  onFormChange()
}

const calculateCost = async () => {
  if (!canCalculate.value) return
  
  isLoading.value = true
  try {
    const params: any = {}
    
    if (needsColorMode.value) {
      params.color_mode = localParameters.color
    }
    
    if (props.service_type === 'risography') {
      params.circulation = formData.quantity
    }
    
    const result = await servicesApi.calculatePrice(props.service_type, params);
    serviceData.value = Array.isArray(result) ? result[0] : result;

    if (pageCount.value && pageCount.value > 0) {
      calculatedCost.value = serviceData.value.base_price * pageCount.value * formData.quantity;
    } else {
      calculatedCost.value = serviceData.value.base_price * formData.quantity;
    }
    
    notification.success({
      title: 'Успешно',
      content: `Стоимость услуги успешно рассчитана`,
      duration: 3000
    })
    
  } catch (error) {
    console.error('Ошибка расчета:', error)
    notification.error({
      title: 'Ошибка',
      content: 'Не удалось рассчитать стоимость',
      duration: 5000
    })
  } finally {
    isLoading.value = false
  }
}

const submitOrder = () => {
  showConfirmModal.value = true
}

const confirmOrder = async () => {
  showConfirmModal.value = false
  isSubmitting.value = true
  
  try {
    const formDataSend = new FormData();
    formDataSend.append('service_id', serviceData.value.service_id);
    formDataSend.append('quantity', formData.quantity.toString());
    formDataSend.append('parameters', JSON.stringify({
        format: localParameters.format,
        ...(needsColorMode.value && { color_mode: localParameters.color }),
      ...(props.service_type === 'scan' && { quality: localParameters.quality }),
      ...(props.service_type === 'risography' && { circulation: formData.quantity })
    }));
    formDataSend.append('notes', comment.value);
    
    // Добавляем файл (если есть)
    if (uploadedFile.value) {
        formDataSend.append('file', uploadedFile.value);
        formDataSend.append('file_name', uploadedFile.value.name);
        formDataSend.append('file_size', uploadedFile.value.size.toString());
        formDataSend.append('file_pages', pageCount.value);
    }
    
    // Отправляем
    const newOrder = await ordersApi.create(formDataSend);
     
    notification.success({
      title: 'Заказ оформлен',
      content: 'Ваш заказ успешно оформлен. Ожидайте подтверждения.',
      duration: 5000
    })
    
    // Переход на страницу заказов
    router.push(`/orders/${newOrder.order_id}`)
    
  } catch (error: any) {
    console.error('Ошибка оформления заказа:', error)
    notification.error({
      title: 'Ошибка',
      content: error.response?.data?.message || 'Не удалось оформить заказ',
      duration: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}

const cancelOrder = () => {
  showConfirmModal.value = false
  notification.info({
    title: 'Отмена',
    content: 'Оформление заказа отменено',
    duration: 3000
  })
}

// Watchers
watch(() => props.service_type, (newType) => {
  formData.service_type = newType
  uploadedFile.value = null
  calculatedCost.value = null
  comment.value = ''
  
  if (!needsColorMode.value) {
    delete localParameters.color
  } else {
    localParameters.color = 'color'
  }
  
  updateParameters()
})

onMounted(() => {
  updateParameters()
})
</script>

<style scoped>
.order-page {
  padding: 40px 20px;
}

.order-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow);
}

.order-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 24px 0;
  text-align: center;
}

.file-info {
  margin-top: 12px;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px;
}

.cost-alert {
  margin-bottom: 24px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
