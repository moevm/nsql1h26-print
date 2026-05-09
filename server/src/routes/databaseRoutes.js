import express from 'express';
import multer from 'multer';
import { exportDatabase, importDatabase } from '../controllers/databaseController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/export', protect, requireAdmin, exportDatabase);
router.post('/import', protect, requireAdmin, upload.single('file'), importDatabase);

export default router;
