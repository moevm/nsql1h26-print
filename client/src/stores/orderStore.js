import { defineStore } from 'pinia';

export const useOrderStore = defineStore('orderStore', () => {
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

    const mapColorModeText = (colorMode) => {
        const modes = {
            color: 'Цветная',
            bw: 'Чёрно-белая'
        };
        return modes[colorMode] || colorMode || '—';
    };

    const getParamValue = (params, keys, fallback = '—') => {
        for (const key of keys) {
            if (params?.[key] !== undefined && params[key] !== null && params[key] !== '') {
                return params[key];
            }
        }
        return fallback;
    };

    return {
        mapStatusText,
        mapServiceTypeText,
        mapColorModeText,
        getParamValue,
    };
});
