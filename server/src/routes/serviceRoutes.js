import express from 'express';
import * as serviceController from '../controllers/serviceController.js';

const router = express.Router();

router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);
router.put('/:id', serviceController.updateService);
router.post('/', serviceController.createService);

export default router;
