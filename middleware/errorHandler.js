export const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err);

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ 
      message: 'Erreur de validation', 
      errors: messages 
    });
  }

  // Erreur de casting Mongoose (ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      message: 'ID invalide' 
    });
  }

  // Erreur de duplication (email déjà utilisé)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ 
      message: `Ce ${field} est déjà utilisé` 
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Token invalide' 
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      message: 'Token expiré' 
    });
  }

  // Erreur par défaut
  res.status(err.statusCode || 500).json({
    message: err.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
