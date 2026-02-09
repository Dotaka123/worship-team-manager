import Member from '../models/Member.js';
import Cotisation from '../models/Cotisation.js';
import Attendance from '../models/Attendance.js';
import cloudinary from '../config/cloudinary.js';

// Créer un membre
export const createMember = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      gender,
      email, 
      dateOfBirth, 
      residence, 
      phone, 
      role, 
      instrument, 
      status, 
      dateEntree, 
      notesAccompagnement 
    } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ 
        message: 'Le prénom et le nom sont requis' 
      });
    }

    if (email) {
      const existingMember = await Member.findOne({ 
        email: email.toLowerCase(),
        createdBy: req.user._id 
      });
      if (existingMember) {
        return res.status(400).json({ 
          message: 'Cet email est déjà utilisé' 
        });
      }
    }

    const member = new Member({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender: gender || 'homme',
      email: email ? email.toLowerCase() : null,
      dateOfBirth: dateOfBirth || null,
      residence: residence || null,
      phone: phone || null,
      role: role || 'Musicien',
      instrument: instrument || null,
      status: status || 'actif',
      dateEntree: dateEntree || new Date(),
      notesAccompagnement: notesAccompagnement || null,
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

// Récupérer un membre avec stats
export const getMember = async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Stats cotisations
    const cotisations = await Cotisation.find({ member: member._id }).sort({ mois: -1 });
    const cotisationsPaye = cotisations.filter(c => c.statut === 'paye').length;
    const cotisationsNonPaye = cotisations.filter(c => c.statut === 'non_paye').length;

    // Stats présences - CORRIGÉ avec les bonnes valeurs
    const presences = await Attendance.find({ member: member._id });
    const totalPresent = presences.filter(p => p.status === 'present').length;
    const totalAbsent = presences.filter(p => p.status === 'absent').length;
    const totalRetard = presences.filter(p => p.status === 'en_retard').length; // ← CORRIGÉ
    const totalExcused = presences.filter(p => p.status === 'excused').length;
    const totalPresences = presences.length;
    const tauxPresence = totalPresences > 0 
      ? Math.round(((totalPresent + totalRetard) / totalPresences) * 100) // retards comptent comme présent
      : 0;

    // 6 derniers mois cotisations pour chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cotisationsChart = cotisations
      .filter(c => new Date(c.mois + '-01') >= sixMonthsAgo)
      .slice(0, 6);

    // Historique présences (10 dernières) - CORRIGÉ sans populate repetition
    const presenceHistory = await Attendance.find({ member: member._id })
      .sort({ date: -1 })
      .limit(10);

    // Jours avant anniversaire
    let joursAvantAnniversaire = null;
    if (member.dateOfBirth) {
      const today = new Date();
      const birth = new Date(member.dateOfBirth);
      const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      joursAvantAnniversaire = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
    }

    res.json({
      member,
      cotisations,
      presenceHistory,
      stats: {
        cotisationsPaye,
        cotisationsNonPaye,
        totalCotisations: cotisations.length,
        cotisationsChart,
        joursAvantAnniversaire,
        totalPresent,
        totalAbsent,
        totalRetard,
        totalExcused,
        totalPresences,
        tauxPresence
      }
    });
  } catch (error) {
    console.error('❌ getMember error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un membre
export const updateMember = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      gender,
      email, 
      dateOfBirth, 
      residence, 
      phone, 
      role, 
      instrument, 
      status, 
      dateEntree, 
      notesAccompagnement 
    } = req.body;

    const member = await Member.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    if (email && email.toLowerCase() !== member.email) {
      const existingMember = await Member.findOne({ 
        email: email.toLowerCase(),
        createdBy: req.user._id,
        _id: { $ne: req.params.id }
      });
      if (existingMember) {
        return res.status(400).json({ 
          message: 'Cet email est déjà utilisé' 
        });
      }
    }

    if (firstName) member.firstName = firstName.trim();
    if (lastName) member.lastName = lastName.trim();
    if (gender) member.gender = gender;
    if (email !== undefined) member.email = email ? email.toLowerCase() : null;
    if (dateOfBirth !== undefined) member.dateOfBirth = dateOfBirth || null;
    if (residence !== undefined) member.residence = residence || null;
    if (phone !== undefined) member.phone = phone || null;
    if (role) member.role = role;
    if (instrument !== undefined) member.instrument = instrument || null;
    if (status) member.status = status;
    if (dateEntree) member.dateEntree = dateEntree;
    if (notesAccompagnement !== undefined) member.notesAccompagnement = notesAccompagnement || null;

    await member.save();
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

    // Supprimer aussi ses cotisations et présences
    await Cotisation.deleteMany({ member: req.params.id });
    await Attendance.deleteMany({ member: req.params.id });

    res.json({ message: 'Membre supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload photo
export const uploadPhoto = async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }

    // L'URL est déjà dans req.file.path grâce à multer-storage-cloudinary
    member.photo = req.file.path;
    await member.save();

    res.json({ photo: member.photo });
  } catch (error) {
    console.error('❌ uploadPhoto error:', error);
    res.status(500).json({ message: error.message });
  }
};
