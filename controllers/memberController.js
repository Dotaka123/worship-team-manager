import Member from '../models/Member.js';

// Obtenir tous les membres (avec filtre par statut)
export const getMembers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const members = await Member.find(filter)
      .sort({ lastName: 1, firstName: 1 });
    
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir un membre par ID
export const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }
    
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer un membre
export const createMember = async (req, res) => {
  try {
    const memberData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const member = await Member.create(memberData);
    res.status(201).json(member);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Cet email est déjà utilisé' 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un membre
export const updateMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }
    
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un membre
export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }
    
    res.json({ message: 'Membre supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
