import path from 'path';
import fs from 'fs';
import { Order } from '../models/orderModel.js';

export const createOrder = async (req, res) => {
    try {
        const {user_id, service_id, ...orderData } = req.body;
        const file = req.file;
        if (!service_id) {
            return res.status(400).json({ message: 'service_id обязателен' });
        }

        const orderWithFile = {
            ...orderData,
            file_name: file?.filename,
            file_original_name: file?.originalname,
            file_path: file?.path
        };
        const newOrder = await Order.create(user_id, service_id, orderWithFile);
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFile = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order || !order.file_name) {
            return res.status(404).json({ message: 'Файл не найден' });
        }
        
        const filePath = path.join(process.cwd(), 'uploads/orders', order.file_name);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Файл удален' });
        }
        
        // Отправляем файл
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find(req.query);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Заказ не найден' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOrdersByUser = async (req, res) => {
    try {
        if (req.user.user_id !== req.params.id) {
            console.log(req.user.user_id);
            console.log(req.params);
            return res.status(403).json({ message: 'Доступ запрещён' });
        }
        const filters = {
            ...req.query,
            userId: req.user.user_id
        };
        const orders = await Order.find(filters);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const updatedOrder = await Order.update(req.params.id, req.body);
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Заказ не найден или ошибка обновления' });
        }
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
