import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import databaseRoutes from './routes/databaseRoutes.js';
import driver from './config/db.js';
import { seedDatabase } from './scripts/seeds.js';
import { Database } from './models/databaseModel.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/test', (req, res) => {
    res.json({ message: 'Hello from Express!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/database', databaseRoutes);

const PORT = 3000;

const resolveBootstrapDumpPath = async () => {
    if (process.env.IMPORT_DUMP_PATH) {
        return path.resolve(process.env.IMPORT_DUMP_PATH);
    }
    const exportDir = path.join(process.cwd(), 'uploads', 'exports');
    try {
        const files = await fs.readdir(exportDir);
        const exportFiles = files
            .filter((file) => file.endsWith('.json') && file.startsWith('export-'))
            .sort();

        if (exportFiles.length === 0) return null;
        const latest = exportFiles[exportFiles.length - 1];
        return path.join(exportDir, latest);
    } catch {
        return null;
    }
};

const initDatabase = async () => {
    const session = driver.session();
    try {
        const constraints = [
            'CREATE CONSTRAINT unique_user_id IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE',
            'CREATE CONSTRAINT unique_order_id IF NOT EXISTS FOR (o:Order) REQUIRE o.order_id IS UNIQUE',
            'CREATE CONSTRAINT unique_service_id IF NOT EXISTS FOR (s:Service) REQUIRE s.service_id IS UNIQUE',
            'CREATE CONSTRAINT unique_history_id IF NOT EXISTS FOR (h:StatusHistory) REQUIRE h.history_id IS UNIQUE',
            'CREATE CONSTRAINT unique_log_id IF NOT EXISTS FOR (l:ImportExportLogs) REQUIRE l.log_id IS UNIQUE',
            'CREATE CONSTRAINT unique_user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE'
        ];

        for (const query of constraints) {
            await session.run(query);
            console.log(`Создано ограничение: ${query.substring(0, 60)}...`);
        }
        const dumpPath = await resolveBootstrapDumpPath();
        if (dumpPath) {
            try {
                const importResult = await Database.importFromFileIfEmpty(dumpPath);
                if (importResult.imported) {
                    console.log(`Загружен стартовый дамп из файла: ${importResult.file_path}`);
                }
            } catch (error) {
                console.error('Ошибка стартового импорта:', error.message);
            }
        }
        if (process.env.NODE_ENV === 'development') {
            await seedDatabase();
        }
    } catch (error) {
        console.error('Database initialization error:', error);
    } finally {
        await session.close();
    }
};

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await initDatabase();
});

process.on('SIGINT', async () => {
    await driver.close();
    console.log('Neo4j connection closed');
    process.exit(0);
});
