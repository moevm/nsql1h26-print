<template>
  <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top" size="large">
    <n-form-item label="Фамилия" path="last_name" required>
      <n-input
        v-model:value="formData.last_name"
        placeholder="Введите фамилию"
        size="large"
        clearable
      />
    </n-form-item>

    <n-form-item label="Имя" path="first_name" required>
      <n-input
        v-model:value="formData.first_name"
        placeholder="Введите имя"
        size="large"
        clearable
      />
    </n-form-item>

    <n-form-item label="Номер телефона" path="phone" required>
      <n-input
        v-model:value="formData.phone"
        placeholder="+7 (999) 123-45-67"
        size="large"
        clearable
      />
    </n-form-item>

    <n-form-item label="Email" path="email" required>
      <n-input
        v-model:value="formData.email"
        placeholder="example@mail.ru"
        size="large"
        clearable
      />
    </n-form-item>

    <n-form-item label="Пароль" path="password" required>
      <n-input
        v-model:value="formData.password"
        type="password"
        placeholder="Введите пароль"
        size="large"
        show-password-on="click"
        clearable
      />
    </n-form-item>

    <n-form-item label="Подтверждение пароля" path="confirmPassword" required>
      <n-input
        v-model:value="formData.confirmPassword"
        type="password"
        placeholder="Повторите пароль"
        size="large"
        show-password-on="click"
        clearable
      />
    </n-form-item>

    <n-form-item>
      <div style="display: flex; justify-content: center; gap: 40px; width: 100%;">
        <n-button
          @click="handleCancel"
        >
          Отмена
        </n-button>
        <n-button
          type="primary"
          :disabled="!isFormValid || loading"
          @click="handleSubmit"
        >
          Зарегистрироваться
        </n-button>  
      </div>
    </n-form-item>
  </n-form>
</template>

<script setup>
import { useUserStore } from '@/stores/userStore';
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  useNotification,
} from 'naive-ui';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
const notification = useNotification();

const formRef = ref(null);
const loading = ref(false);

const formData = reactive({
  last_name: '',
  first_name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const isFormValid = computed(() => {
  return (
    formData.last_name.trim() !== '' &&
    formData.first_name.trim() !== '' &&
    formData.phone.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.password.trim() !== '' &&
    formData.confirmPassword.trim() !== ''
  );
});

// Валидация подтверждения пароля
const validateConfirmPassword = (_rule, value) => {
  if (!value) {
    return new Error('Подтвердите пароль');
  }
  if (value !== formData.password) {
    return new Error('Пароли не совпадают');
  }
  return true;
};

// Правила валидации
const rules = {
  last_name: [
    {
      required: true,
      message: 'Введите фамилию',
      trigger: ['blur', 'input'],
    },
    {
      min: 2,
      message: 'Фамилия должна содержать минимум 2 символа',
      trigger: ['blur'],
    },
  ],
  first_name: [
    {
      required: true,
      message: 'Введите имя',
      trigger: ['blur', 'input'],
    },
    {
      min: 2,
      message: 'Имя должно содержать минимум 2 символа',
      trigger: ['blur'],
    },
  ],
  phone: [
    {
      required: true,
      message: 'Введите номер телефона',
      trigger: ['blur', 'input'],
    },
    {
      pattern: /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/,
      message: 'Введите корректный номер телефона',
      trigger: ['blur'],
    },
  ],
  email: [
    {
      required: true,
      message: 'Введите email',
      trigger: ['blur', 'input'],
    },
    {
      type: 'email',
      message: 'Введите корректный email',
      trigger: ['blur'],
    },
  ],
  password: [
    {
      required: true,
      message: 'Введите пароль',
      trigger: ['blur', 'input'],
    },
    {
      min: 6,
      message: 'Пароль должен содержать минимум 6 символов',
      trigger: ['blur'],
    },
  ],
  confirmPassword: [
    {
      required: true,
      message: 'Подтвердите пароль',
      trigger: ['blur', 'input'],
    },
    {
      validator: validateConfirmPassword,
      trigger: ['blur', 'input'],
    },
  ],
};

// Отправка формы
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    await userStore.register({
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
    });

    notification.success({
      title: 'Успешно',
      content: 'Регистрация прошла успешно',
      duration: 3000,
    });

    router.push('/');
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    
    // Обработка ошибки дубликата email
    const errorMessage = error?.response?.data?.message || 'Ошибка регистрации';
    
    notification.error({
      title: 'Ошибка',
      content: errorMessage,
      duration: 5000,
    });
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  router.back();
}
</script>