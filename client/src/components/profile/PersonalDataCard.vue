<template>
  <div class="data-card">
    <h2 class="title">Личные данные</h2>

    <div class="data-grid">
      <div class="field">
        <div class="label">Имя</div>
        <div class="value">{{ profile.firstName }}</div>
      </div>

      <div class="field">
        <div class="label">Фамилия</div>
        <div class="value">{{ profile.lastName }}</div>
      </div>

      <div class="field">
        <div class="label">Телефон</div>
        <div class="value">{{ profile.phone }}</div>
      </div>

      <div class="field">
        <div class="label">Email</div>
        <div class="value">{{ profile.email }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '../../stores/userStore';

const userStore = useUserStore();

const profile = computed(() => {
  const user = userStore.user || {};
  return {
    firstName: user.first_name || '—',
    lastName: user.last_name || '—',
    phone: user.phone || '—',
    email: user.email || '—'
  };
});
</script>

<style scoped>
.data-card {
  background-color: #d9d9d9;
  border-radius: 30px;
  padding: 20px 24px;
  min-height: 520px;
}

.title {
  margin: 0 0 20px;
  font-size: 26px;
  font-weight: 800;
  color: #101010;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 40px;
}

.label {
  font-size: 18px;
  color: #4b5563;
  margin-bottom: 6px;
}

.value {
  font-size: 20px;
  font-weight: 400;
  color: #101010;
  word-break: break-word;
}
</style>
