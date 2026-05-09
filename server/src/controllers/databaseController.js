import fs from 'fs/promises';
import path from 'path';
import { Database } from '../models/databaseModel.js';

const EXPORT_DIR = path.join(process.cwd(), 'uploads', 'exports');

export const exportDatabase = async (req, res) => {
    const adminUserId = req.user?.user_id;

    try {
        const payload = await Database.exportAll();
        const fileName = `export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const saveOnServer = String(req.query.save_on_server || '').toLowerCase() === 'true';
        const content = JSON.stringify(payload, null, 2);
        let filePath = null;

        if (saveOnServer) {
            await fs.mkdir(EXPORT_DIR, { recursive: true });
            filePath = path.join(EXPORT_DIR, fileName);
            await fs.writeFile(filePath, content, 'utf-8');
        }

        await Database.createImportExportLog({
            adminUserId,
            operationType: 'export',
            status: 'success'
        });

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('X-Export-Nodes-Count', String(payload.nodes.length));
        res.setHeader('X-Export-Relationships-Count', String(payload.relationships.length));
        if (filePath) {
            res.setHeader('X-Export-Server-Path', filePath);
        }
        res.status(200).send(content);
    } catch (error) {
        try {
            await Database.createImportExportLog({
                adminUserId,
                operationType: 'export',
                status: 'failed'
            });
        } catch (logError) {
            console.error('Не удалось сохранить лог экспорта:', logError.message);
        }

        res.status(500).json({ error: error.message });
    }
};

export const importDatabase = async (req, res) => {
    const adminUserId = req.user?.user_id;
    if (!req.file) {
        return res.status(400).json({ error: 'Не передан файл импорта (multipart поле: file)' });
    }
    try {
        const payload = JSON.parse(req.file.buffer.toString('utf-8'));
        const result = await Database.importFromPayload(payload, adminUserId);
        res.json({
            format: 'json',
            ...result
        });
    } catch (error) {
        try {
            await Database.createImportExportLog({
                adminUserId,
                operationType: 'import',
                status: 'failed'
            });
        } catch (logError) {
            console.error('Не удалось сохранить лог импорта:', logError.message);
        }
        res.status(500).json({ error: error.message });
    }
};
