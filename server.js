
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import attendanceRoutes from './routes/attendance.js';
import noteRoutes from './routes/notes.js';

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notes', noteRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Worship Team Manager' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
