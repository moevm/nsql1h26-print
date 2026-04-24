import express from 'express';
import * as orderController from '../controllers/orderController.js';
import {validateCreateOrder, validateUpdateOrder} from '../middleware/orderValidator.js';
import {uploadOrderFile} from '../middleware/uploadFileMiddleware.js';
import {protect} from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', orderController.getOrders);
router.get('/user/:id', protect, orderController.getOrdersByUser);
router.put('/:id', protect, validateUpdateOrder, orderController.updateOrder);
router.get('/:id/file', orderController.getFile);
router.post('/', protect, uploadOrderFile, validateCreateOrder, orderController.createOrder);
router.get('/:id', orderController.getOrderById);

export default router;
