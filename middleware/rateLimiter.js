import rateLimit from 'express-rate-limit';

/**
 * Rate limiter général pour toutes les routes API
 * 1000 requêtes par 15 minutes par IP (au lieu de 100)
 * Plus adapté pour une utilisation normale
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limite de 1000 requêtes par fenêtre (était 100)
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
 * 10 tentatives par 15 minutes par IP (au lieu de 5)
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limite de 10 tentatives de connexion (était 5)
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
 * 10 inscriptions par heure par IP (au lieu de 3)
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // Limite de 10 inscriptions (était 3)
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
 * 50 générations par heure (au lieu de 10)
 */
export const generateCotisationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 50, // Augmenté de 10 à 50
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
 * 100 emails par heure (au lieu de 20)
 */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 100, // Augmenté de 20 à 100
  message: {
    message: 'Trop d\'envois d\'emails. Veuillez réessayer dans 1 heure.'
  }
});

/**
 * Rate limiter pour les exports (PDF/Excel)
 * 100 exports par heure (au lieu de 30)
 */
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 100, // Augmenté de 30 à 100
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
