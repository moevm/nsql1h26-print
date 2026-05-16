import express from 'express';
import * as orderController from '../controllers/orderController.js';
import {validateCreateOrder, validateUpdateOrder} from '../middleware/orderValidator.js';
import {uploadOrderFile} from '../middleware/uploadFileMiddleware.js';
import {protect, requireAdmin} from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, requireAdmin, orderController.getOrders);
router.get('/user/:id', protect, orderController.getOrdersByUser);
router.put('/:id', protect, requireAdmin, validateUpdateOrder, orderController.updateOrder);
router.get('/:id/file', protect, orderController.getFile);
router.post('/', protect, uploadOrderFile, validateCreateOrder, orderController.createOrder);
router.get('/:id', protect, orderController.getOrderById);

export default router;
