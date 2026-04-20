import axiosInstance from './axios';

export const ordersApi = {
  // Получить все заказы (для сотрудника)
  getAll(params = {}) {
    return axiosInstance.get('/orders', {
      params,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).then(res => res.data);
  },
  
  // Получить один заказ
  getById(orderId) {
    return axiosInstance.get(`/orders/${orderId}`).then(res => res.data);
  },
  
  // Обновить заказ (статус)
  update(orderId, data) {
    return axiosInstance.put(`/orders/${orderId}`, data).then(res => res.data);
  }
};