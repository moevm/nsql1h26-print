import express from 'express';
import multer from 'multer';
import { exportDatabase, importDatabase, getImportExportLogs } from '../controllers/databaseController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/export', protect, requireAdmin, exportDatabase);
router.post('/import', protect, requireAdmin, upload.single('file'), importDatabase);
router.get('/logs', protect, requireAdmin, getImportExportLogs);

export default router;
