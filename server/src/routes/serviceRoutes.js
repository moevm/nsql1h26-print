import express from 'express';
import * as serviceController from '../controllers/serviceController.js';
import {validateCreateService, validateUpdateService} from '../middleware/serviceValidator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, serviceController.getServices);
router.get('/:id', protect, serviceController.getServiceById);
router.put('/:id', protect, validateUpdateService, serviceController.updateService);
router.post('/', protect, validateCreateService, serviceController.createService);

export default router;