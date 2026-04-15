import { Service } from '../models/serviceModel.js';

export const getServices = async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ message: 'Услуга не найдена' });
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createService = async (req, res) => {
    const { service_type, base_price, color_mode, start_circulation,
        end_circulation } = req.body;
    if (!service_type || !base_price) {
        return res.status(400).json({ message: 'Тип услуги и базовая цена обязательны' });
    }

    const allowedTypes = ['scan', 'print', 'risography'];
    if (!allowedTypes.includes(service_type)) {
        return res.status(400).json({ message: `Недопустимый тип услуги. Разрешены: ${allowedTypes.join(', ')}` });
    }

    if (typeof base_price !== 'number' || base_price < 0) {
        return res.status(400).json({ message: 'Цена должна быть положительным числом' });
    }

    if (service_type === 'scan' || service_type === 'print') {
        const allowedColors = ['color', 'bw'];
        if (!allowedColors.includes(color_mode)) {
            return res.status(400).json({ message: 'Для этой услуги color_mode должен быть "color" или "bw"' });
        }
    }

    if ((service_type === 'scan' || service_type === 'print') && color_mode === undefined) {
        return res.status(400).json({ message: 'Цветность обязательна для печати/скана' });
    }

    if (service_type === 'risography' && (start_circulation === undefined || end_circulation === undefined)) {
        return res.status(400).json({ message: 'Диапазон тиража для получения цены обязателен' });
    }

    if (service_type === 'risography') {
        if (!Number.isInteger(start_circulation) || !Number.isInteger(end_circulation)) {
            return res.status(400).json({ message: 'Тираж должен быть целым числом' });
        }
        if (start_circulation < 0 || start_circulation >= end_circulation) {
            return res.status(400).json({ message: 'Некорректный диапазон тиража' });
        }
    }

    if (service_type === 'risography' && color_mode !== undefined) {
        return res.status(400).json({ message: 'У ризографии нет параметра цветность' });
    }

    try {
        const newService = await Service.create(req.body);
        res.status(201).json(newService);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateService = async (req, res) => {
    try {
        const updated = await Service.update(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: 'Услуга не найдена' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
