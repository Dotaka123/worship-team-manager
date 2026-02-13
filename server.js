import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { initializeCronJobs } from './services/cronService.js';

// Import des routes
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import eventRoutes from './routes/events.js';
import attendanceRoutes from './routes/attendance.js';
import cotisationRoutes from './routes/cotisations.js';
import noteRoutes from './routes/notes.js';
import userRoutes from './routes/users.js';
import statisticsRoutes from './routes/statistics.js';

// Nouvelles routes améliorées
import advancedStatsRoutes from './routes/advancedStatistics.js';
import memberSearchRoutes from './routes/memberSearch.js';
import exportsRoutes from './routes/exports.js';

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

// Rate limiting global
app.use('/api/', generalLimiter);

// ✅ Health Check - IMPORTANT pour Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: 'connected',
    version: '2.1.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      validation: true,
      rateLimiting: true,
      cronJobs: true,
      notifications: true,
      advancedStats: true,
      exports: true
    }
  });
});

// Routes API - Ordre important (spécifique avant général)
app.use('/api/auth', authRoutes);
app.use('/api/members/search', memberSearchRoutes); // Avant /api/members
app.use('/api/members', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/cotisations', cotisationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);

// Nouvelles routes améliorées
app.use('/api/stats', advancedStatsRoutes);
app.use('/api/exports', exportsRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Worship Team Manager - v2.1.0',
    version: '2.1.0',
    features: [
      '✅ Validation Joi',
      '✅ Rate Limiting',
      '✅ Notifications Email',
      '✅ Tâches Automatiques (Cron)',
      '✅ Statistiques Avancées',
      '✅ Exports Excel/CSV',
      '✅ Recherche Avancée'
    ],
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      members: '/api/members',
      memberSearch: '/api/members/search',
      events: '/api/events',
      attendance: '/api/attendance',
      cotisations: '/api/cotisations',
      notes: '/api/notes',
      users: '/api/users',
      statistics: '/api/statistics',
      advancedStats: '/api/stats',
      exports: '/api/exports'
    },
    documentation: 'https://github.com/votre-repo/README.md'
  });
});

// Gestion des erreurs
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// ✅ CRITICAL: Écouter sur 0.0.0.0 pour Render
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 WORSHIP TEAM MANAGER API v2.1.0');
  console.log('='.repeat(60));
  console.log(`📡 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Listening on 0.0.0.0:${PORT} (accessible from outside)`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log('\n📦 FONCTIONNALITÉS ACTIVES:');
  console.log('  ✅ Système de rôles (viewer, responsable, admin)');
  console.log('  ✅ Validation des données (Joi)');
  console.log('  ✅ Rate Limiting (protection)');
  console.log('  ✅ Notifications Email (Mailjet)');
  console.log('  ✅ Tâches automatiques (Cron)');
  console.log('  ✅ Statistiques avancées');
  console.log('  ✅ Exports Excel/CSV');
  console.log('  ✅ Recherche avancée');
  console.log('='.repeat(60) + '\n');
  
  // Initialiser les tâches automatiques
  if (process.env.ENABLE_CRON !== 'false') {
    initializeCronJobs();
  } else {
    console.log('⚠️  Tâches automatiques désactivées (ENABLE_CRON=false)\n');
  }
});

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM reçu. Arrêt gracieux du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT reçu. Arrêt gracieux du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

export default app;
