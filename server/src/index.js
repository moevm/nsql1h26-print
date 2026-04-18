import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import authRoutes from "./routes/authRoutes.js";
import driver from './config/db.js';
import { seedDatabase } from './scripts/seeds.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
    res.json({ message: 'Hello from Express!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PORT = 3000;

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
    
    if (process.env.NODE_ENV === 'development') {
        await seedDatabase();
    }

    for (const query of constraints) {
      await session.run(query);
      console.log(`Constraint created: ${query.substring(0, 60)}...`);
    }
    console.log('Database constraints initialized');
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
