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

  const role = useStorage('userRole', null, localStorage, {
    serializer: {
      read: (value) => {
        return value === 'admin' || value === 'employee' || value === 'client' ? value : null;
      },
      write: (value) => value ?? '',
    },
  });

  const isLoading = ref(false);

  const isAdmin = computed(() => role.value === 'admin');
  const isEmployee = computed(() => role.value === 'employee');
  const isClient = computed(() => role.value === 'client');
  const isRoleReady = computed(() => role.value !== null);
  const isAuthenticated = computed(() => !!user.value);

  // Методы
  function setUser(userData) {
    user.value = userData;
    role.value = userData.role;
  }

  async function login(email, password) {
    isLoading.value = true;
    try {
      const data = await authApi.login(email, password);
      setUser(data);
      await router.push('/');
      
      return data;
    } catch (error) {
      console.error('Ошибка входа:', error);
      
      if (error.status === 400) {
        throw new AuthError(error.message || 'Ошибка в данных', error);
      } else if (error.status === 409) {
        throw new AuthError('Пользователь с таким email уже существует', error);
      } else if (error.status === 500) {
        throw new AuthError('Ошибка сервера. Попробуйте позже', error);
      }
      
      throw new AuthError('Ошибка регистрации', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function register(userData) {
    isLoading.value = true;
    try {
      const data = await authApi.register(userData);
      setUser(data);
      await router.push('/');
      
      return data;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      
      if (error.status === 400) {
        throw new AuthError(error.message || 'Ошибка в данных', error);
      } else if (error.status === 409) {
        throw new AuthError('Пользователь с таким email уже существует', error);
      } else if (error.status === 500) {
        throw new AuthError('Ошибка сервера. Попробуйте позже', error);
      }
      
      throw new AuthError('Ошибка регистрации', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    user.value = null;
    role.value = null;
    await router.push('/login');
  }

  return {
    user,
    role,
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