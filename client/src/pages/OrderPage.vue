<template>
  <div>
    <!-- Для сотрудников/админов -->
    <EmployeeOrderPage
      v-if="userStore.isEmployee || userStore.isAdmin" 
    />
    
    <!-- Для клиентов -->
    <ClientOrderPage 
      v-else 
    />
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/userStore';
import EmployeeOrderPage from '@/pages/employee/EmployeeOrderPage.vue';
import ClientOrderPage from '@/pages/client/ClientOrderPage.vue';

const userStore = useUserStore();
</script>