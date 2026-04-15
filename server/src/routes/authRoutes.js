import express from 'express';
import { login, register } from '../controllers/userController.js';
import {validateLogin, validateRegister} from '../middleware/userValidator.js';

const router = express.Router();
router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);

export default router;
