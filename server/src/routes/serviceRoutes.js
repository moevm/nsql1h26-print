import express from 'express';
import * as serviceController from '../controllers/serviceController.js';
import {validateCreateService, validateUpdateService} from '../middleware/serviceValidator.js';
import { protect } from '../middleware/authMiddleware.js';

const checkAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещён: недостаточно прав' });
  }
  next();
};

const router = express.Router();

router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);
router.post('/', protect, checkAdmin, validateCreateService, serviceController.createService);
router.put('/:id', protect, checkAdmin, validateUpdateService, serviceController.updateService);

export default router;
