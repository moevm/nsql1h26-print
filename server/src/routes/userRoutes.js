import express from 'express';
import * as userController from '../controllers/userController.js';
import {validateUpdateUser} from '../middleware/userValidator.js';

const router = express.Router();

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', validateUpdateUser, userController.updateUser);

export default router;
