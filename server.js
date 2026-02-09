import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import eventRoutes from './routes/events.js';
import attendanceRoutes from './routes/attendance.js';
import cotisationRoutes from './routes/cotisations.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/cotisations', cotisationRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Worship Team Manager - Version optimisée',
    version: '2.0'
  });
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      auth: 'ok',
      members: 'ok',
      events: 'ok',
      attendance: 'ok' // ← AJOUTÉ
    }
  });
});

// Middleware de gestion d'erreurs
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
