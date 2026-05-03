import axiosInstance from './axios';

export const usersApi = {
  // Получить всех пользователей с фильтрами
  getAll(params = {}) {
    return axiosInstance.get('/users', {
      params,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).then(res => res.data);
  },
  
  // Обновить пользователя (роль, статус)
  update(userId, data) {
    return axiosInstance.put(`/users/${userId}`, data).then(res => res.data);
  },
  
  // Деактивировать пользователя
  //deactivate(userId, reason = '') {
  //  return axiosInstance.patch(`/users/${userId}/deactivate`, { reason }).then(res => res.data);
  //},

  getById(userId) {
    return axiosInstance.get(`/users/${userId}`).then(res => res.data);
  }
};