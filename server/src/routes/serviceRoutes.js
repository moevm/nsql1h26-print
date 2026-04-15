import express from 'express';
import * as serviceController from '../controllers/serviceController.js';
import {validateCreateService, validateUpdateService} from '../middleware/serviceValidator.js';

const router = express.Router();

router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);
router.put('/:id', validateUpdateService, serviceController.updateService);
router.post('/', validateCreateService, serviceController.createService);

export default router;
