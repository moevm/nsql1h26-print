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
