import { defineStore } from 'pinia';
import { ref } from 'vue';
import axiosInstance from '@/api/axios';

export const useOrderStore = defineStore('orderStore', () => {
    const orders = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const currentOrder = ref(null);
    const orderLoading = ref(false);
    const orderError = ref(null);

    const mapStatusText = (status) => {
        const statuses = {
            pending: 'В обработке',
            accepted: 'Принят',
            ready: 'Готов к выдаче',
            completed: 'Завершен'
        };
        return statuses[status] || status;
    };

    const mapServiceTypeText = (serviceType) => {
        const types = {
            scan: 'Сканирование',
            print: 'Печать',
            risography: 'Ризография'
        };
        return types[serviceType] || serviceType || 'Услуга';
    };

    async function fetchOrders() {
        loading.value = true;
        error.value = null;

        try {
            const response = await axiosInstance.get('/orders');

            orders.value = response.data.map(item => ({
                id: item.order_id,
                number: item.order_id.slice(0, 8).toUpperCase(),
                title: mapServiceTypeText(item.service_type),
                status: item.status,
                statusText: mapStatusText(item.status),
                date: new Date(item.created_at).toLocaleDateString(),
                totalPrice: Number(item.total_price || 0)
            }));
        } catch (err) {
            error.value = err.response?.data?.message || 'Не удалось загрузить заказы';
        } finally {
            loading.value = false;
        }
    }

    async function fetchOrderById(id) {
        orderLoading.value = true;
        orderError.value = null;

        try {
            const { data } = await axiosInstance.get(`/orders/${id}`);

            currentOrder.value = {
                id: data.order_id,
                number: `Заказ №${data.order_id.slice(0, 8).toUpperCase()}`,
                status: data.status,
                statusText: mapStatusText(data.status),
                total: Number(data.total_price || 0),
                type: mapServiceTypeText(data.service_type),
                file: data.file_name || '—',
                format: data.format || '—',
                comment: data.comment || '—',
                paperType: data.paper_type || '—',
                color: data.color || '—',
                postProcessing: data.post_processing || '—',
                quantity: data.quantity || 0
            };

        } catch (err) {
            orderError.value = err.response?.data?.message || 'Не удалось загрузить заказ';
        } finally {
            orderLoading.value = false;
        }
    }

    return {
        orders,
        loading,
        error,
        fetchOrders,

        currentOrder,
        orderLoading,
        orderError,
        fetchOrderById
    };
});
