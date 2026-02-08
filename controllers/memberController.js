import Member from '../models/Member.js';

// Obtenir tous les membres
export const getMembers = async (req, res) => {
  try {
    const { role, group, active } = req.query;
    const filter = { createdBy: req.user._id };

    if (role) filter.role = role;
    if (group) filter.group = group;
    if (active !== undefined) filter.isActive = active === 'true';

    const members = await Member.find(filter).sort({ name: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir un membre par ID
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

// Créer un membre
export const createMember = async (req, res) => {
  try {
    const member = await Member.create({
      ...req.body,
      createdBy: req.user._id
    });
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Modifier un membre
export const updateMember = async (req, res) => {
  try {
    const member = await Member.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    res.json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Désactiver/Réactiver un membre
export const toggleMemberStatus = async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    member.isActive = !member.isActive;
    await member.save();

    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
