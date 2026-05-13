<template>
  <div class="import-export-container">
    <n-card :bordered="false" class="control-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">Управление данными</span>
          <n-space>
            <n-button 
              type="primary" 
              size="small"
              :loading="exportLoading"
              @click="handleExportWithSave"
            >
              <template #icon>
                <n-icon><LogOutOutline /></n-icon>
              </template>
              Экспорт
            </n-button>

            <n-button 
              type="primary" 
              size="small"
              :loading="importLoading"
              @click="handleImportClick"
            >
              <template #icon>
                <n-icon><LogInOutline /></n-icon>
              </template>
              Импорт
            </n-button>
          </n-space>
        </div>
      </template>

      <!-- История логов -->
      <div class="logs-section">
        <div class="logs-header">
          <span class="logs-title">История операций</span>
          <n-space>
            <n-select
              v-model:value="filters.operationType"
              placeholder="Тип операции"
              clearable
              size="small"
              :options="operationOptions"
              style="width: 130px"
              @update:value="handleFilterChange"
            />
            <n-select
              v-model:value="filters.status"
              placeholder="Статус"
              clearable
              size="small"
              :options="statusOptions"
              style="width: 120px"
              @update:value="handleFilterChange"
            />
            <n-button size="small" @click="refreshLogs">
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
            </n-button>
          </n-space>
        </div>

        <n-data-table
          :columns="columns"
          :data="logs"
          :loading="logsLoading"
          :pagination="pagination"
          :remote="true"
          :bordered="false"
          size="small"
        />
      </div>
    </n-card>

    <!-- Модальное окно для выбора файла импорта -->
    <n-modal v-model:show="showImportModal" preset="dialog" title="Импорт данных">
      <template #default>
        <n-space vertical>
          <n-text>Выберите JSON файл для импорта:</n-text>
          <n-upload
            action="#"
            :custom-request="handleFileUpload"
            :max="1"
            accept=".json"
            :show-file-list="false"
          >
            <n-button>
              <template #icon>
                <n-icon><FolderOpenOutline /></n-icon>
              </template>
              Выбрать файл
            </n-button>
          </n-upload>
          <n-text v-if="selectedFile" type="info">
            Выбран файл: {{ selectedFile.name }}
          </n-text>
        </n-space>
      </template>
      
      <template #action>
        <n-space>
          <n-button @click="showImportModal = false">Отмена</n-button>
          <n-button 
            type="primary" 
            :loading="importLoading"
            :disabled="!selectedFileObj"
            @click="confirmImport"
          >
            Импортировать
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h, computed } from 'vue'
import { 
  NCard, 
  NSpace, 
  NButton, 
  NIcon,
  NModal, 
  NText, 
  NUpload,
  NDataTable,
  NSelect,
  NTag,
  useNotification 
} from 'naive-ui'
import { 
  FolderOpenOutline,
  RefreshOutline,
  LogInOutline,
  LogOutOutline 
} from '@vicons/ionicons5'
import { databaseApi } from '@/api/database'

const exportLoading = ref(false)
const importLoading = ref(false)
const showImportModal = ref(false)
const selectedFile = ref(null)
const selectedFileObj = ref(null)
const logsLoading = ref(false)
const logs = ref([])
const totalLogs = ref(0)

// Пагинация
const currentPage = ref(1)
const pageSize = ref(10)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [5, 10, 20],
  prefix: ({ itemCount }) => `Всего: ${itemCount}`,
  // Эти функции Naive UI вызовет сам при клике на стрелки или цифры
  onChange: (page) => {
    pagination.page = page
    loadLogs() // вызываем загрузку
  },
  onUpdatePageSize: (pageSize) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    loadLogs()
  }
})

const notification = useNotification()

// Фильтры
const filters = reactive({
  operationType: null,
  status: null
})

const operationOptions = [
  { label: 'Импорт', value: 'import' },
  { label: 'Экспорт', value: 'export' }
]

const statusOptions = [
  { label: 'Успешно', value: 'success' },
  { label: 'Ошибка', value: 'failed' }
]

// Колонки таблицы
const columns = [
  {
    title: 'ID',
    key: 'log_id',
    width: 150,
    align: 'center'
  },
  {
    title: 'Тип',
    key: 'operation_type',
    width: 100,
    render(row) {
      const typeMap = {
        import: { label: 'Импорт', type: 'info' },
        export: { label: 'Экспорт', type: 'primary' }
      }
      const config = typeMap[row.operation_type]
      return h(NTag, { type: config.type, size: 'small' }, { default: () => config.label })
    }
  },
  {
    title: 'Статус',
    key: 'status',
    width: 100,
    render(row) {
      const statusMap = {
        success: { label: 'Успех', type: 'success' },
        failed: { label: 'Ошибка', type: 'error' }
      }
      const config = statusMap[row.status]
      return h(NTag, { type: config.type, size: 'small' }, { default: () => config.label })
    }
  },
  {
    title: 'Дата',
    key: 'created_at',
    width: 180,
    render(row) {
      return new Date(row.created_at).toLocaleString('ru-RU')
    }
  },
  {
    title: 'Администратор',
    key: 'admin_user_id',
    width: 150,
    render(row) {
      if (row.admin && (row.admin.first_name || row.admin.last_name)) {
        return `${row.admin.first_name || ''} ${row.admin.last_name || ''}`.trim()
      }
      return row.admin?.email || 'Система'
    }
  }
]

// Загрузка логов
const loadLogs = async () => {
  logsLoading.value = true
  try {
    const offset = (pagination.page - 1) * pagination.pageSize
    
    const result = await databaseApi.getImportExportLogs({
      limit: pagination.pageSize,
      offset: offset,
      operationType: filters.operationType,
      status: filters.status
    })
    
    logs.value = result.logs || []
    pagination.itemCount = result.total || 0
    
  } catch (error) {
    console.error('Ошибка загрузки логов:', error)
    notification.error({ title: 'Ошибка', content: 'Не удалось загрузить историю' })
  } finally {
    logsLoading.value = false
  }
}

// Обновление логов
const refreshLogs = () => {
  pagination.page = 1
  loadLogs()
}

// Смена фильтра
const handleFilterChange = () => {
  pagination.page = 1
  loadLogs()
}

// Экспорт
const handleExportWithSave = async () => {
  exportLoading.value = true
  
  try {
    const { blob, filename, serverPath, nodesCount, relationshipsCount } = await databaseApi.exportDatabase(true)
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    notification.success({
      title: 'Успех',
      content: `Экспорт завершен. Файл сохранен на сервере: ${serverPath}\n${nodesCount} узлов, ${relationshipsCount} связей`,
      duration: 5000
    })
    
    refreshLogs()
  } catch (error) {
    console.error('Ошибка экспорта:', error)
    notification.error({
      title: 'Ошибка',
      content: error.response?.data?.error || 'Ошибка при экспорте данных',
      duration: 3000
    })
  } finally {
    exportLoading.value = false
  }
}

// Импорт
const handleImportClick = () => {
  showImportModal.value = true
  selectedFile.value = null
  selectedFileObj.value = null
}

const handleFileUpload = async ({ file, onFinish, onError }) => {
  try {
    if (!file.name.endsWith('.json')) {
      notification.error({
        title: 'Ошибка',
        content: 'Пожалуйста, выберите JSON файл',
        duration: 3000
      })
      onError(new Error('Неверный формат файла'))
      return
    }
    
    if (file.file.size > 10 * 1024 * 1024) {
      notification.error({
        title: 'Ошибка',
        content: 'Размер файла не должен превышать 10MB',
        duration: 3000
      })
      onError(new Error('Файл слишком большой'))
      return
    }
    
    selectedFileObj.value = file.file 
    selectedFile.value = file
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        JSON.parse(e.target.result)
        notification.success({
          title: 'Файл загружен',
          content: `Файл "${file.name}" загружен и проверен`,
          duration: 2000
        })
        onFinish()
      } catch (parseError) {
        notification.error({
          title: 'Ошибка',
          content: 'Неверный формат JSON файла',
          duration: 3000
        })
        onError(parseError)
      }
    }
    reader.onerror = () => {
      notification.error({
        title: 'Ошибка',
        content: 'Ошибка чтения файла',
        duration: 3000
      })
      onError(new Error('Ошибка чтения файла'))
    }
    reader.readAsText(file.file)
    
  } catch (error) {
    notification.error({
      title: 'Ошибка',
      content: 'Ошибка при загрузке файла',
      duration: 3000
    })
    onError(error)
  }
}

const confirmImport = async () => {
  if (!selectedFileObj.value) {
    notification.warning({
      title: 'Предупреждение',
      content: 'Пожалуйста, выберите файл для импорта',
      duration: 3000
    })
    return
  }
  
  importLoading.value = true
  
  try {
    const result = await databaseApi.importDatabase(selectedFileObj.value)
    
    notification.success({
      title: 'Импорт завершен',
      content: `${result.imported_nodes || 0} узлов, ${result.imported_relationships || 0} связей`,
      duration: 4000
    })
    
    showImportModal.value = false
    selectedFile.value = null
    selectedFileObj.value = null
    
    refreshLogs()
    
  } catch (error) {
    console.error('Ошибка импорта:', error)
    notification.error({
      title: 'Ошибка импорта',
      content: error.response?.data?.error || error.message || 'Ошибка при импорте данных',
      duration: 3000
    })
  } finally {
    importLoading.value = false
  }
}

// Загружаем логи при монтировании
onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.import-export-container {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.control-card {
  width: 100%;
  max-width: 1200px;
  box-shadow: var(--shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
}

.logs-section {
  margin-top: 20px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.logs-title {
  font-size: 16px;
  font-weight: 500;
}
</style>