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
        res.setHeader(
            'Access-Control-Expose-Headers', 
            'X-Export-Nodes-Count, X-Export-Relationships-Count, X-Export-Server-Path, Content-Disposition'
        );
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

export const getImportExportLogs = async (req, res) => {
    try {
        const limit = Number(req.query.limit ?? 50);
        const offset = Number(req.query.offset ?? 0);
        const operationType = req.query.operation_type || null;
        const status = req.query.status || null;

        if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
            return res.status(400).json({ error: 'Параметр limit должен быть целым числом от 1 до 200' });
        }

        if (!Number.isInteger(offset) || offset < 0) {
            return res.status(400).json({ error: 'Параметр offset должен быть целым числом >= 0' });
        }

        if (operationType && !['import', 'export'].includes(operationType)) {
            return res.status(400).json({ error: "Параметр operation_type может быть только 'import' или 'export'" });
        }

        if (status && !['success', 'failed'].includes(status)) {
            return res.status(400).json({ error: "Параметр status может быть только 'success' или 'failed'" });
        }

        const result = await Database.getImportExportLogs({
            limit,
            offset,
            operationType,
            status
        });

        res.json({
            limit,
            offset,
            total: result.total,
            logs: result.logs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
