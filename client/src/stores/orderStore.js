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
            completed: 'Завершен',
            cancelled: 'Отменен',
            processing: 'В процессе'
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

    const getParamValue = (params, keys, fallback = '—') => {
        for (const key of keys) {
            if (params?.[key] !== undefined && params[key] !== null && params[key] !== '') {
                return params[key];
            }
        }
        return fallback;
    };

    async function fetchOrdersByUser(userId) {
        loading.value = true;
        error.value = null;

        try {
            const response = await axiosInstance.get(`/orders/user/${userId}`);

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
            const params = data.parameters || {};

            currentOrder.value = {
                id: data.order_id,
                number: `Заказ №${data.order_id.slice(0, 8).toUpperCase()}`,
                status: data.status,
                statusText: mapStatusText(data.status),
                total: Number(data.total_price || 0),
                type: mapServiceTypeText(data.service_type),
                file: data.file_name || '—',
                format: getParamValue(params, ['format', 'page_format']),
                comment: data.notes || '—',
                paperType: getParamValue(params, ['paper_type', 'paperType']),
                color: getParamValue(params, ['color_mode', 'colorMode', 'color']),
                postProcessing: getParamValue(params, ['post_processing', 'postProcessing']),
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
        fetchOrdersByUser,

        currentOrder,
        orderLoading,
        orderError,
        fetchOrderById
    };
});
