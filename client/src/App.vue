<script setup>
import {
  NConfigProvider,
  NNotificationProvider,
  NMessageProvider,
  NDialogProvider,
  dateRuRU,
  ruRU,
} from 'naive-ui';

const themeOverrides = {
  common: {
    primaryColor: '#3355AB',
    primaryColorHover: '#334a85',
    primaryColorPressed: '#334a85',
    borderRadius: '15px',
  }
}
</script>


<template>
  <!-- Все Naive UI компоненты внутри будут на русском -->
  <n-config-provider :locale="ruRU" :date-locale="dateRuRU" :theme-overrides="themeOverrides">
    <n-message-provider>
      <!-- Провайдер уведомлений -->
      <n-notification-provider>
        <n-dialog-provider>
          <router-view />
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>
