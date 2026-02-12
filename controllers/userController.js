import User from '../models/User.js';

// Obtenir tous les utilisateurs (admin seulement)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -emailVerificationToken -emailVerificationExpires')
      .sort({ createdAt: -1 });
    
    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir un utilisateur spécifique (admin seulement)
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -emailVerificationExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour le rôle d'un utilisateur (admin seulement)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    // Vérifier que le rôle est valide
    if (!['viewer', 'responsable', 'admin'].includes(role)) {
      return res.status(400).json({ 
        message: 'Rôle invalide. Les rôles valides sont: viewer, responsable, admin' 
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Empêcher un utilisateur de modifier son propre rôle
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Vous ne pouvez pas modifier votre propre rôle' 
      });
    }
    
    user.role = role;
    await user.save();
    
    res.json({
      message: `Rôle de ${user.name} mis à jour avec succès`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un utilisateur (admin seulement)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Empêcher un utilisateur de se supprimer lui-même
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Vous ne pouvez pas supprimer votre propre compte via cette route' 
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Promouvoir un utilisateur en admin par email (admin seulement)
export const promoteToAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ 
        message: `Aucun utilisateur trouvé avec l'email: ${email}` 
      });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({ 
        message: `${user.name} est déjà administrateur` 
      });
    }
    
    user.role = 'admin';
    await user.save();
    
    res.json({
      message: `${user.name} a été promu administrateur avec succès`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rétrograder un admin en responsable (admin seulement)
export const demoteFromAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ 
        message: `Aucun utilisateur trouvé avec l'email: ${email}` 
      });
    }
    
    if (user.role !== 'admin') {
      return res.status(400).json({ 
        message: `${user.name} n'est pas administrateur` 
      });
    }
    
    // Empêcher un admin de se rétrograder lui-même
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Vous ne pouvez pas rétrograder votre propre compte' 
      });
    }
    
    user.role = 'responsable';
    await user.save();
    
    res.json({
      message: `${user.name} a été rétrogradé en responsable`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
