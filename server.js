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
import userRoutes from './routes/users.js'; // Nouvelle route pour gérer les utilisateurs

dotenv.config();

const app = express();

// Connexion à MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/cotisations', cotisationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes); // Route pour la gestion des utilisateurs (admin seulement)

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Worship Team Manager - Système de rôles actif' });
});

// Gestion des erreurs
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Système de rôles activé: viewer (lecture seule), responsable, admin`);
});
