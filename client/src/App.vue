<script setup>
import {
  NConfigProvider,
  NNotificationProvider,
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
    <!-- Провайдер уведомлений -->
    <n-notification-provider>
      <router-view />
    </n-notification-provider>
  </n-config-provider>
</template>
