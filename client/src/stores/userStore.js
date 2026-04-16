import axiosInstance from '@/api/axios';
import { useStorage } from '@vueuse/core';
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

  // useStorage для role (admin, employee, client)
  const role = useStorage('userRole', null, localStorage, {
    serializer: {
      read: (value) => {
        return value === 'admin' || value === 'employee' || value === 'client' ? value : null;
      },
      write: (value) => value ?? '',
    },
  });

  // useStorage для user (сохраняем целиком)
  const user = useStorage('user', null, localStorage, {
    serializer: {
      read: (value) => {
        try {
          const parsed = JSON.parse(value);
          return parsed?.id ? parsed : null;
        } catch {
          return null;
        }
      },
      write: (value) => JSON.stringify(value),
    },
  });

  // useStorage для token
  const token = useStorage('token', null, localStorage);

  const isLoading = ref(false);

  // Геттеры
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

    // useStorage автоматически сохранил всё в localStorage
  }

  async function login(email, password) {
    isLoading.value = true;
    try {
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
      });

      setUser(response.data);
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
      console.log(response.data)
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
    role,
    user,
    token,
    isLoading,
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
});