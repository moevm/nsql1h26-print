import { Order } from '../models/orderModel.js';

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { service_id, ...orderData } = req.body;
        if (!service_id) {
            return res.status(400).json({ message: 'service_id обязателен' });
        }
        const newOrder = await Order.create(userId, service_id, orderData);
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        // if (req.user.role !== 'admin' && req.user.role !== 'employee') {
        //     return res.status(403).json({ message: 'Доступ запрещен' });
        // }

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
        const orders = await Order.find({ userId: req.user.user_id });
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
