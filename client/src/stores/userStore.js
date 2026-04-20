// stores/userStore.js
import axiosInstance from '@/api/axios';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

class AuthError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AuthError';
    this.cause = cause;
  }
}

export const useUserStore = defineStore('user', () => {
  const router = useRouter();

  // Состояние (state) - теперь обычные ref, без useStorage
  const user = ref(null);
  const token = ref(null);
  const role = ref(null);
  const isLoading = ref(false);

  // Геттеры
  const userId = computed(() => user.value?.user_id || null);
  const isAdmin = computed(() => role.value === 'admin');
  const isEmployee = computed(() => role.value === 'employee');
  const isClient = computed(() => role.value === 'client');
  const isRoleReady = computed(() => role.value !== null);
  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // Методы
  function setUser(data) {
    user.value = data.user;
    token.value = data.token;
    role.value = data.user.role;
    // Плагин автоматически сохранит всё в localStorage
  }

  async function login(email, password) {
    isLoading.value = true;
    try {
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
      });

      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка входа:', error);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error;
        if (axiosError.response?.status === 401) {
          throw new AuthError('Неверный email или пароль', error);
        } else if (axiosError.response?.status === 500) {
          throw new AuthError('Ошибка сервера. Попробуйте позже', error);
        } else if (axiosError.response?.status === 404) {
          throw new AuthError('Сервер не найден. Проверьте подключение.', error);
        }
      }

      throw new AuthError('Ошибка авторизации', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function register(userData) {
    isLoading.value = true;
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      console.log(response.data);
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка регистрации:', error);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error;
        if (axiosError.response?.status === 400) {
          throw new AuthError(axiosError.response?.data?.message || 'Ошибка в данных', error);
        } else if (axiosError.response?.status === 409) {
          throw new AuthError('Пользователь с таким email уже существует', error);
        } else if (axiosError.response?.status === 500) {
          throw new AuthError('Ошибка сервера. Попробуйте позже', error);
        }
      }

      throw new AuthError('Ошибка регистрации', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    user.value = null;
    token.value = null;
    role.value = null;
    await router.push('/login');
  }

  return {
    user,
    token,
    role,
    isLoading,
    userId,
    isAdmin,
    isEmployee,
    isClient,
    isRoleReady,
    isAuthenticated,
    setUser,
    login,
    register,
    logout,
  };
}, {
  // Конфигурация persist - данные будут автоматически сохраняться в localStorage
  persist: {
    key: 'user-store',           // Ключ в localStorage
    paths: ['user', 'token', 'role'], // Сохраняем только эти поля
    storage: localStorage,       // Используем localStorage
  }
});