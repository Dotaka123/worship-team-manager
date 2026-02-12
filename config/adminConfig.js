/**
 * Configuration des Administrateurs
 * 
 * Ce fichier permet de définir les emails qui doivent être automatiquement
 * considérés comme administrateurs lors de leur inscription.
 * 
 * UTILISATION:
 * 1. Ajoutez vos emails dans le tableau ADMIN_EMAILS ci-dessous
 * 2. Importez ce fichier dans authController.js
 * 3. Les comptes avec ces emails seront automatiquement admins
 */

// Liste des emails qui seront automatiquement admins
export const ADMIN_EMAILS = [
  // Ajoutez vos emails ici
  'votre.email@exemple.com',
  // 'admin@worship.com',
  // 'responsable@eglise.com',
];

/**
 * Vérifie si un email doit être admin par défaut
 * @param {string} email - L'email à vérifier
 * @returns {boolean} - true si l'email est dans la liste des admins
 */
export const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

/**
 * Obtient le rôle par défaut pour un email donné
 * @param {string} email - L'email de l'utilisateur
 * @returns {string} - 'admin' si l'email est dans la liste, 'viewer' sinon
 */
export const getDefaultRole = (email) => {
  return isAdminEmail(email) ? 'admin' : 'viewer';
};

// Export par défaut pour faciliter l'import
export default {
  ADMIN_EMAILS,
  isAdminEmail,
  getDefaultRole
};
