import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
    res.json({ message: 'Hello from Express!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

