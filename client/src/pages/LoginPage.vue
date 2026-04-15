<template>
  <div class="login-page">
    <n-card class="login-card">
      <template #header>
        <div class="login-header">
          <h1 class="login-title">Вход</h1>
        </div>
      </template>

      <LoginForm />
      
      <template #footer>
        <div class="login-footer">
          <n-text depth="3">Нет аккаунта?</n-text>
          <n-button text type="primary" @click="goToRegister">
            Зарегистрироваться
          </n-button>
        </div>
      </template>
    </n-card>
  </div>
</template>

<script setup>
import LoginForm from '@/components/auth/LoginForm.vue';
import { NCard, NText, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';

const router = useRouter();

const goToRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-block-start: 20vh;
}

.login-card {
  max-width: 450px;
  width: 100%;
  border-radius: 15px;
  box-shadow: var(--shadow);
}

.login-header {
  text-align: center;
}

.login-title {
  font-size: 2rem;
  color: #000;
}

.login-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}
</style>
