import express from 'express';
import * as orderController from '../controllers/orderController.js';
import {validateCreateOrder, validateUpdateOrder} from '../middleware/orderValidator.js';
import {protect} from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', orderController.getOrders);
router.get('/user/:id', protect, orderController.getOrdersByUser);
router.put('/:id', validateUpdateOrder, orderController.updateOrder);
router.post('/', protect, validateCreateOrder, orderController.createOrder);
router.get('/:id', orderController.getOrderById);

export default router;
