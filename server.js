import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import des routes
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import eventRoutes from './routes/events.js';
import attendanceRoutes from './routes/attendance.js';
import cotisationRoutes from './routes/cotisations.js';
import noteRoutes from './routes/notes.js';
import userRoutes from './routes/users.js';
import statisticsRoutes from './routes/statistics.js';

dotenv.config();

const app = express();

// Connexion à MongoDB
connectDB();

// Middlewares - CORS configuré pour production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Health Check - IMPORTANT pour Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: 'connected',
    version: '2.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/cotisations', cotisationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Worship Team Manager - Système de rôles actif',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      members: '/api/members',
      events: '/api/events',
      attendance: '/api/attendance',
      cotisations: '/api/cotisations',
      notes: '/api/notes',
      users: '/api/users',
      statistics: '/api/statistics'
    }
  });
});

// Gestion des erreurs
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// ✅ CRITICAL: Écouter sur 0.0.0.0 pour Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Système de rôles activé: viewer (lecture seule), responsable, admin`);
  console.log(`🔗 Health check disponible: /health`);
  console.log(`🌍 Listening on 0.0.0.0:${PORT} (accessible from outside)`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
