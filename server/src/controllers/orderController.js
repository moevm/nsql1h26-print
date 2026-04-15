import { Order } from '../models/orderModel.js';

export const createOrder = async (req, res) => {
    try {
        // в будущем user_id будет браться из req.user
        const { user_id, service_id, ...orderData } = req.body;
        const newOrder = await Order.create(user_id, service_id, orderData);
        res.status(201).json(newOrder);
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
        const orders = await Order.find({ userId: req.params.userId });
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
