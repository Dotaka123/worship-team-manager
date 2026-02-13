import Joi from 'joi';

/**
 * Middleware de validation avec Joi
 * @param {Joi.Schema} schema - Le schéma Joi à valider
 * @param {string} property - La propriété à valider (body, query, params)
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Retourner toutes les erreurs
      stripUnknown: true // Enlever les champs non définis
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        message: 'Erreur de validation',
        errors
      });
    }

    // Remplacer par les valeurs validées (avec conversions de type)
    req[property] = value;
    next();
  };
};

// ============================================
// SCHÉMAS DE VALIDATION
// ============================================

// Validation des membres
export const memberSchemas = {
  create: Joi.object({
    firstName: Joi.string().min(2).max(50).required()
      .messages({
        'string.min': 'Le prénom doit contenir au moins 2 caractères',
        'string.max': 'Le prénom ne peut pas dépasser 50 caractères',
        'any.required': 'Le prénom est requis'
      }),
    
    lastName: Joi.string().min(2).max(50).required()
      .messages({
        'string.min': 'Le nom doit contenir au moins 2 caractères',
        'string.max': 'Le nom ne peut pas dépasser 50 caractères',
        'any.required': 'Le nom est requis'
      }),
    
    pseudo: Joi.string().min(2).max(20).required()
      .messages({
        'string.min': 'Le pseudo doit contenir au moins 2 caractères',
        'string.max': 'Le pseudo ne peut pas dépasser 20 caractères',
        'any.required': 'Le pseudo est requis'
      }),
    
    email: Joi.string().email().allow(null, '').optional()
      .messages({
        'string.email': 'Email invalide'
      }),
    
    phone: Joi.string().pattern(/^[0-9]{10}$/).allow(null, '').optional()
      .messages({
        'string.pattern.base': 'Le téléphone doit contenir 10 chiffres'
      }),
    
    gender: Joi.string().valid('homme', 'femme').default('homme'),
    
    dateOfBirth: Joi.date().max('now').allow(null).optional()
      .messages({
        'date.max': 'La date de naissance ne peut pas être dans le futur'
      }),
    
    residence: Joi.string().max(100).allow(null, '').optional(),
    
    role: Joi.string().valid('Chanteur', 'Musicien', 'Technicien').default('Musicien'),
    
    instrument: Joi.string().max(50).allow(null, '').optional(),
    
    status: Joi.string().valid('actif', 'inactif', 'en_pause').default('actif'),
    
    dateEntree: Joi.date().max('now').default(Date.now),
    
    notesAccompagnement: Joi.string().max(500).allow(null, '').optional()
  }),

  update: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    pseudo: Joi.string().min(2).max(20).optional(),
    email: Joi.string().email().allow(null, '').optional(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).allow(null, '').optional(),
    gender: Joi.string().valid('homme', 'femme').optional(),
    dateOfBirth: Joi.date().max('now').allow(null).optional(),
    residence: Joi.string().max(100).allow(null, '').optional(),
    role: Joi.string().valid('Chanteur', 'Musicien', 'Technicien').optional(),
    instrument: Joi.string().max(50).allow(null, '').optional(),
    status: Joi.string().valid('actif', 'inactif', 'en_pause').optional(),
    dateEntree: Joi.date().max('now').optional(),
    notesAccompagnement: Joi.string().max(500).allow(null, '').optional()
  }).min(1) // Au moins un champ doit être fourni
};

// Validation des cotisations
export const cotisationSchemas = {
  create: Joi.object({
    membre: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
      .messages({
        'string.pattern.base': 'ID de membre invalide',
        'any.required': 'Le membre est requis'
      }),
    
    mois: Joi.string().pattern(/^\d{4}-\d{2}$/).required()
      .messages({
        'string.pattern.base': 'Le mois doit être au format YYYY-MM',
        'any.required': 'Le mois est requis'
      }),
    
    montant: Joi.number().min(0).max(1000000).default(3000)
      .messages({
        'number.min': 'Le montant ne peut pas être négatif',
        'number.max': 'Le montant est trop élevé'
      }),
    
    statut: Joi.string().valid('paye', 'non_paye').default('non_paye'),
    
    methodePaiement: Joi.string().valid('Espèces', 'Mobile Money', 'Virement', 'Chèque').allow(null, '').optional(),
    
    datePaiement: Joi.date().max('now').allow(null).optional(),
    
    notes: Joi.string().max(200).allow(null, '').optional()
  }),

  update: Joi.object({
    statut: Joi.string().valid('paye', 'non_paye').optional(),
    montant: Joi.number().min(0).max(1000000).optional(),
    methodePaiement: Joi.string().valid('Espèces', 'Mobile Money', 'Virement', 'Chèque').allow(null, '').optional(),
    datePaiement: Joi.date().max('now').allow(null).optional(),
    notes: Joi.string().max(200).allow(null, '').optional()
  }).min(1),

  generate: Joi.object({
    mois: Joi.string().pattern(/^\d{4}-\d{2}$/).required()
      .messages({
        'string.pattern.base': 'Le mois doit être au format YYYY-MM',
        'any.required': 'Le mois est requis'
      })
  })
};

// Validation des présences
export const attendanceSchemas = {
  record: Joi.object({
    memberId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
      .messages({
        'string.pattern.base': 'ID de membre invalide',
        'any.required': 'Le membre est requis'
      }),
    
    date: Joi.date().max('now').required()
      .messages({
        'date.max': 'La date ne peut pas être dans le futur',
        'any.required': 'La date est requise'
      }),
    
    status: Joi.string().valid('present', 'absent', 'excused', 'en_retard').required()
      .messages({
        'any.only': 'Le statut doit être: present, absent, excused ou en_retard',
        'any.required': 'Le statut est requis'
      }),
    
    type: Joi.string().max(50).default('Répétition'),
    
    reason: Joi.string().max(200).allow(null, '').optional(),
    
    arrivalTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null, '').optional()
      .messages({
        'string.pattern.base': 'L\'heure doit être au format HH:MM'
      })
  }),

  update: Joi.object({
    status: Joi.string().valid('present', 'absent', 'excused', 'en_retard').optional(),
    type: Joi.string().max(50).optional(),
    reason: Joi.string().max(200).allow(null, '').optional(),
    arrivalTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null, '').optional()
  }).min(1)
};

// Validation des événements
export const eventSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(100).required()
      .messages({
        'string.min': 'Le titre doit contenir au moins 3 caractères',
        'any.required': 'Le titre est requis'
      }),
    
    date: Joi.date().required()
      .messages({
        'any.required': 'La date est requise'
      }),
    
    type: Joi.string().valid('Répétition', 'Concert', 'Culte', 'Formation', 'Autre').default('Répétition'),
    
    description: Joi.string().max(500).allow(null, '').optional(),
    
    location: Joi.string().max(100).allow(null, '').optional()
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    date: Joi.date().optional(),
    type: Joi.string().valid('Répétition', 'Concert', 'Culte', 'Formation', 'Autre').optional(),
    description: Joi.string().max(500).allow(null, '').optional(),
    location: Joi.string().max(100).allow(null, '').optional()
  }).min(1)
};

// Validation de l'authentification
export const authSchemas = {
  register: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Email invalide',
        'any.required': 'L\'email est requis'
      }),
    password: Joi.string().min(6).max(100).required()
      .messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
        'any.required': 'Le mot de passe est requis'
      }),
    role: Joi.string().valid('admin', 'user').default('user')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updatePassword: Joi.object({
    currentPassword: Joi.string().required()
      .messages({
        'any.required': 'Le mot de passe actuel est requis'
      }),
    newPassword: Joi.string().min(6).max(100).required()
      .messages({
        'string.min': 'Le nouveau mot de passe doit contenir au moins 6 caractères',
        'any.required': 'Le nouveau mot de passe est requis'
      })
  })
};

// Validation des recherches
export const searchSchemas = {
  members: Joi.object({
    q: Joi.string().min(1).max(50).optional(),
    role: Joi.string().valid('Chanteur', 'Musicien', 'Technicien').optional(),
    status: Joi.string().valid('actif', 'inactif', 'en_pause').optional(),
    minAge: Joi.number().min(0).max(150).optional(),
    maxAge: Joi.number().min(0).max(150).optional(),
    instrument: Joi.string().max(50).optional(),
    gender: Joi.string().valid('homme', 'femme').optional()
  })
};

export default {
  validate,
  memberSchemas,
  cotisationSchemas,
  attendanceSchemas,
  eventSchemas,
  authSchemas,
  searchSchemas
};
