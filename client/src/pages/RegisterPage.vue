<template>
  <div class="register-page">
    <n-card class="register-card">
      <template #header>
        <div class="register-header">
          <h1 class="register-title">Регистрация</h1>
        </div>
      </template>

      <RegisterForm />
      
      <template #footer>
        <div class="register-footer">
          Уже есть аккаунт? 
          <n-button text type="primary" @click="goToLogin">
            Войти
          </n-button>
        </div>
      </template>
    </n-card>
  </div>
</template>

<script setup>
import RegisterForm from '@/components/auth/RegisterForm.vue';
import { NCard, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';

const router = useRouter();

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-block-start: 2vh;
  margin-block-end: 2vh;
}

.register-card {
  max-width: 550px;
  width: 100%;
  border-radius: 15px;
  box-shadow: var(--shadow);
}

.register-header {
  text-align: center;
}

.register-title {
  font-size: 2rem;
  color: #000;
}

.register-footer {
  text-align: center;
  padding: 8px 0;
}
</style>