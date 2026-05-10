<template>
  <div class="import-export-container">
    <n-card title="Управление данными" :bordered="false" class="control-card">
      <n-space justify="center" size="large">
        <!-- Кнопка экспорта -->
        <n-button 
          type="primary" 
          size="large"
          :loading="exportLoading"
          @click="handleExportWithSave"
        >
          Экспорт данных
        </n-button>

        <!-- Кнопка импорта -->
        <n-button 
          type="primary" 
          size="large"
          :loading="importLoading"
          @click="handleImportClick"
        >
          Импорт данных
        </n-button>
      </n-space>
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
import { ref } from 'vue'
import { 
  NCard, 
  NSpace, 
  NButton, 
  NModal, 
  NText, 
  NUpload,
  useNotification 
} from 'naive-ui'
import { databaseApi } from '@/api/database'

const exportLoading = ref(false)
const importLoading = ref(false)
const showImportModal = ref(false)
const selectedFile = ref(null)
const selectedFileObj = ref(null)

const notification = useNotification()

const handleExportWithSave = async () => {
  exportLoading.value = true;
  
  try {
    const { blob, filename, serverPath, nodesCount, relationshipsCount } = await databaseApi.exportDatabase(true);
    
    // Скачиваем файл
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    notification.success({
      title: 'Успех',
      content: `Экспорт завершен. Файл сохранен на сервере: ${serverPath}\n${nodesCount} узлов, ${relationshipsCount} связей`,
      duration: 5000
    });

  } catch (error) {
    console.error('Ошибка экспорта:', error);
    notification.error({
      title: 'Ошибка',
      content: error.response?.data?.error || 'Ошибка при экспорте данных',
      duration: 3000
    });
  } finally {
    exportLoading.value = false;
  }
};

// Обработчик импорта - открытие модального окна
const handleImportClick = () => {
  showImportModal.value = true;
  selectedFile.value = null;
  selectedFileObj.value = null;
};

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
</script>

<style scoped>
.import-export-container {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.control-card {
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow);
}
</style>