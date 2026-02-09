import Member from '../models/Member.js';

// Créer un membre
export const createMember = async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, residence, phone, role, instrument, status } = req.body;

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        message: 'Le prénom et le nom sont requis' 
      });
    }

    // Vérifier si l'email existe (s'il est fourni)
    if (email) {
      const existingMember = await Member.findOne({ 
        email,
        createdBy: req.user._id 
      });
      if (existingMember) {
        return res.status(400).json({ 
          message: 'Cet email est déjà utilisé' 
        });
      }
    }

    const member = new Member({
      firstName,
      lastName,
      email: email || null,
      dateOfBirth: dateOfBirth || null,
      residence: residence || null,
      phone: phone || null,
      role: role || 'other',
      instrument: instrument || null,
      status: status || 'actif',
      createdBy: req.user._id
    });

    await member.save();

    res.status(201).json(member);
  } catch (error) {
    console.error('❌ createMember error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Récupérer tous les membres
export const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer un membre
export const getMember = async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un membre
export const updateMember = async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, residence, phone, role, instrument, status } = req.body;

    const member = await Member.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Vérifier l'email s'il est modifié
    if (email && email !== member.email) {
      const existingMember = await Member.findOne({ 
        email,
        createdBy: req.user._id,
        _id: { $ne: req.params.id }
      });
      if (existingMember) {
        return res.status(400).json({ 
          message: 'Cet email est déjà utilisé' 
        });
      }
    }

    // Mise à jour
    if (firstName) member.firstName = firstName;
    if (lastName) member.lastName = lastName;
    if (email !== undefined) member.email = email || null;
    if (dateOfBirth) member.dateOfBirth = dateOfBirth;
    if (residence !== undefined) member.residence = residence || null;
    if (phone !== undefined) member.phone = phone || null;
    if (role) member.role = role;
    if (instrument !== undefined) member.instrument = instrument || null;
    if (status) member.status = status;

    await member.save(); // Déclenche le middleware pour l'âge

    res.json(member);
  } catch (error) {
    console.error('❌ updateMember error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Supprimer un membre
export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    res.json({ message: 'Membre supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
