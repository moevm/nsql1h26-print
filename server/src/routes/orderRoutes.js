import express from 'express';
import * as orderController from '../controllers/orderController.js';
import {validateCreateOrder, validateUpdateOrder} from '../middleware/orderValidator.js';

const router = express.Router();

router.get('/', orderController.getOrders);
router.get('/user/:id', orderController.getOrdersByUser);
router.put('/:id', validateUpdateOrder, orderController.updateOrder);
router.post('/', validateCreateOrder, orderController.createOrder);
router.get('/:id', orderController.getOrderById);

export default router;
