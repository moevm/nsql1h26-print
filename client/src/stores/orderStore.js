import { defineStore } from 'pinia';
import { ref } from 'vue';
import axiosInstance from '@/api/axios';

export const useOrderStore = defineStore('orderStore', () => {
    const orders = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const mapStatusText = (status) => {
        const statuses = {
            'pending': 'В обработке',
            'accepted': 'Принят',
            'ready': 'Готов к выдаче',
            'completed': 'Завершен'
        };
        return statuses[status] || status;
    };

    async function fetchOrders() {
        loading.value = true;
        error.value = null;
        try {
            const response = await axiosInstance.get('/orders');

            orders.value = response.data.map(item => ({
                id: item.order_id,
                number: item.order_id.slice(0, 8).toUpperCase(),
                title: item.service_type === 'scan' ? 'Сканирование' : 'Печать',
                status: item.status,
                statusText: mapStatusText(item.status),
                date: new Date(item.created_at).toLocaleDateString()
            }));
        } catch (err) {
            console.error('Ошибка при загрузке заказов:', err);
            error.value = err.response?.data?.message || 'Не удалось загрузить заказы';
        } finally {
            loading.value = false;
        }
    }

    return { orders, loading, error, fetchOrders };
});
