import express from 'express';
import * as serviceController from '../controllers/serviceController.js';
import {validateCreateService, validateUpdateService} from '../middleware/serviceValidator.js';
import {protect, requireAdmin} from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', serviceController.getServices);
router.get('/:id', protect, requireAdmin, serviceController.getServiceById);
router.put('/:id', protect, requireAdmin, validateUpdateService, serviceController.updateService);
router.post('/', protect, requireAdmin, validateCreateService, serviceController.createService);

export default router;