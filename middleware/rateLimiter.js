import rateLimit from 'express-rate-limit';

/**
 * Rate limiter général pour toutes les routes API
 * 100 requêtes par 15 minutes par IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite de 100 requêtes par fenêtre
  message: {
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true, // Retourner les infos de rate limit dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactiver les headers `X-RateLimit-*`
  handler: (req, res) => {
    res.status(429).json({
      message: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter strict pour les tentatives de connexion
 * 5 tentatives par 15 minutes par IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite de 5 tentatives de connexion
  message: {
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  },
  skipSuccessfulRequests: true, // Ne compte que les échecs
  handler: (req, res) => {
    console.log(`⚠️ Rate limit atteint pour IP: ${req.ip} sur /login`);
    res.status(429).json({
      message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter pour l'inscription
 * 3 inscriptions par heure par IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Limite de 3 inscriptions
  message: {
    message: 'Trop de tentatives d\'inscription. Veuillez réessayer dans 1 heure.'
  },
  handler: (req, res) => {
    console.log(`⚠️ Rate limit atteint pour IP: ${req.ip} sur /register`);
    res.status(429).json({
      message: 'Trop de tentatives d\'inscription. Veuillez réessayer dans 1 heure.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Rate limiter pour la génération de cotisations
 * 10 générations par heure (pour éviter les abus)
 */
export const generateCotisationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  message: {
    message: 'Trop de générations de cotisations. Veuillez réessayer dans 1 heure.'
  },
  handler: (req, res) => {
    console.log(`⚠️ Rate limit atteint pour IP: ${req.ip} sur /generate`);
    res.status(429).json({
      message: 'Trop de générations de cotisations. Veuillez réessayer dans 1 heure.'
    });
  }
});

/**
 * Rate limiter pour l'envoi d'emails
 * 20 emails par heure
 */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20,
  message: {
    message: 'Trop d\'envois d\'emails. Veuillez réessayer dans 1 heure.'
  }
});

/**
 * Rate limiter pour les exports (PDF/Excel)
 * 30 exports par heure
 */
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 30,
  message: {
    message: 'Trop d\'exports. Veuillez réessayer dans 1 heure.'
  }
});

export default {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  generateCotisationsLimiter,
  emailLimiter,
  exportLimiter
};
