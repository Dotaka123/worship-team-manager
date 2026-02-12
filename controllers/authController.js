import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../services/emailService.js';
import { getDefaultRole } from '../config/adminConfig.js';

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Inscription
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Cet email est déjà utilisé' 
      });
    }

    // Déterminer le rôle par défaut
    // Si l'email est dans la liste des admins prédéfinis, il devient admin
    // Sinon, il devient viewer (lecture seule)
    const defaultRole = getDefaultRole(email);

    // Créer l'utilisateur (non vérifié)
    const user = await User.create({ 
      name, 
      email, 
      password,
      role: defaultRole,
      isEmailVerified: false
    });

    // Créer le token de vérification
    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Envoyer l'email de vérification
    try {
      await sendVerificationEmail(email, name, verificationToken);
      
      // Message spécial si l'utilisateur est devenu admin automatiquement
      const message = defaultRole === 'admin' 
        ? 'Compte administrateur créé avec succès ! Veuillez vérifier votre email pour activer votre compte.'
        : 'Compte créé avec succès ! Veuillez vérifier votre email pour activer votre compte.';
      
      res.status(201).json({
        message,
        email: user.email,
        role: user.role,
        requiresVerification: true
      });
    } catch (emailError) {
      // Si l'envoi d'email échoue, supprimer l'utilisateur
      await User.findByIdAndDelete(user._id);
      throw new Error('Erreur lors de l\'envoi de l\'email de vérification. Veuillez réessayer.');
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vérifier l'email - VERSION JSON SIMPLE
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hasher le token reçu
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Trouver l'utilisateur avec ce token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Token de vérification invalide ou expiré' 
      });
    }

    // Marquer l'email comme vérifié
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Envoyer l'email de bienvenue
    await sendWelcomeEmail(user.email, user.name);

    res.json({
      message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.',
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Renvoyer l'email de vérification
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        message: 'Aucun compte trouvé avec cet email' 
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ 
        message: 'Cet email est déjà vérifié' 
      });
    }

    // Créer un nouveau token de vérification
    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Envoyer l'email
    await sendVerificationEmail(email, user.name, verificationToken);

    res.json({
      message: 'Email de vérification renvoyé avec succès'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Connexion
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier les champs
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email et mot de passe requis' 
      });
    }

    // Trouver l'utilisateur (avec le mot de passe)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        message: 'Identifiants invalides' 
      });
    }

    // Vérifier si l'email est vérifié
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Veuillez vérifier votre email avant de vous connecter',
        requiresVerification: true,
        email: user.email
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Identifiants invalides' 
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir le profil actuel
export const getMe = async (req, res) => {
  res.json(req.user);
};
