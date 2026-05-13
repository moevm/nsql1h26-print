import express from 'express';
import * as userController from '../controllers/userController.js';
import {validateUpdateUser} from '../middleware/userValidator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, userController.getUsers);
router.get('/:id', protect, userController.getUserById);
router.put('/:id', protect, validateUpdateUser, userController.updateUser);

export default router;
