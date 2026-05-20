import path from 'path';
import fs from 'fs';
import { Order } from '../models/orderModel.js';

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            user_id,
            service_id,
            ...orderData
        } = req.body;
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
        const newOrder = await Order.create(
            userId,
            service_id,
            orderWithFile
        );
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFile = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (req.user.role === 'client') {
            const initialStep = order.status_history.find(h => h.notes === 'initial status' || h.new_status === 'pending');
            const creatorId = initialStep ? initialStep.user_id : null;
            if (String(creatorId) !== String(req.user.user_id)) {
                return res.status(403).json({
                    message: 'Доступ запрещён'
                });
            }
        }
        
        if (!order || !order.file_name) {
            return res.status(404).json({ message: 'Файл не найден' });
        }
        
        const filePath = path.join(process.cwd(), 'uploads/orders', order.file_name);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Файл удален' });
        }
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const getOrders = async (req, res) => {
    try {
        let filters = { ...req.query };
        if (req.user.role === 'client') {
            filters.userId = req.user.user_id;
        }
        const orders = await Order.find(filters);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                message: 'Заказ не найден'
            });
        }
        if (req.user.role === 'client') {
            const initialStep = order.status_history.find(h => h.notes === 'initial status' || h.new_status === 'pending');
            const creatorId = initialStep ? initialStep.user_id : null;
            if (String(creatorId) !== String(req.user.user_id)) {
                return res.status(403).json({
                    message: 'Доступ запрещён'
                });
            }
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOrdersByUser = async (req, res) => {
    try {
        const requester = req.user.user_id;
        const role = req.user.role;
        const targetUserId =
            role === 'client'
                ? requester
                : req.params.id;
        if (!targetUserId) {
            return res.status(400).json({
                message: 'user id обязателен'
            });
        }
        const filters = {
            ...req.query,
            userId: targetUserId
        };
        const orders = await Order.find(filters);
        res.json(orders);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const employeeId = req.user.user_id;
        const userRole = req.user.role;
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            return res.status(403).json({message:'Нет доступа' });
        }
        const updatedOrder = await Order.update(
            req.params.id,
            req.body,
            employeeId,
            userRole
        );
        if (!updatedOrder) {
            return res.status(404).json({
                message:
                    'Заказ не найден или ошибка обновления'
            });
        }
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
