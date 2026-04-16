import axiosInstance from '@/api/axios';

export const servicesApi = {
  // Получить все сервисы
  async getAllServices() {
    const response = await axiosInstance.get('/services');
    return response.data;
  },

  // Получить сервис по ID
  async getServiceById(id) {
    const response = await axiosInstance.get(`/services/${id}`);
    return response.data;
  },

  // Создать новую услугу (только для админа)
  async createService(serviceData) {
    const response = await axiosInstance.post('/services', serviceData);
    return response.data;
  },

  // Обновить услугу (только для админа)
  async updateService(id, serviceData) {
    const response = await axiosInstance.put(`/services/${id}`, serviceData);
    return response.data;
  },
};