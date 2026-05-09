import express from 'express';
import { exportDatabase } from '../controllers/databaseController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/export', protect, requireAdmin, exportDatabase);

export default router;
