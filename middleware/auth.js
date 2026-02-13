import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware de protection de base
export const protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier le header Authorization
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        message: 'Non autorisé - Token manquant' 
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        message: 'Utilisateur non trouvé' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Non autorisé - Token invalide' 
    });
  }
};

// Middleware pour vérifier si l'utilisateur peut modifier
export const canModify = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Non autorisé' 
      });
    }

    // Vérifier si l'utilisateur a le droit de modifier
    if (!req.user.canModify()) {
      return res.status(403).json({ 
        message: 'Vous n\'avez pas l\'autorisation de modifier. Contactez un administrateur.',
        canEdit: false
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la vérification des permissions' 
    });
  }
};

// Middleware pour vérifier si l'utilisateur est admin
export const adminOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Non autorisé' 
      });
    }

    if (!req.user.isAdmin()) {
      return res.status(403).json({ 
        message: 'Accès refusé - Réservé aux administrateurs uniquement' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la vérification des permissions' 
    });
  }
};

// Middleware pour restreindre par rôle
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Vous n\'avez pas la permission d\'effectuer cette action'
      });
    }
    next();
  };
};
