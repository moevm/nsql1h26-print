const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const authApi = {
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw { status: response.status, message: error.message || 'Ошибка запроса' };
    }

    return response.json();
  },

  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw { status: response.status, message: error.message || 'Ошибка запроса' };
    }

    return response.json();
  }
}