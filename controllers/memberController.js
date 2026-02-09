import Member from '../models/Member.js';

// 🔄 Fonction pour transformer les données reçues en format attendu
const transformMemberData = (data) => {
  const transformed = { ...data };
  
  // Si "nom" est envoyé au lieu de firstName/lastName, le diviser
  if (data.nom && !data.firstName && !data.lastName) {
    const nameParts = data.nom.trim().split(' ');
    transformed.firstName = nameParts[0];
    transformed.lastName = nameParts.slice(1).join(' ') || nameParts[0];
    delete transformed.nom;
  }
  
  // Si "prenom" est envoyé au lieu de firstName
  if (data.prenom && !data.firstName) {
    transformed.firstName = data.prenom;
    delete transformed.prenom;
  }
  
  // Si "name" est envoyé, le diviser
  if (data.name && !data.firstName && !data.lastName) {
    const nameParts = data.name.trim().split(' ');
    transformed.firstName = nameParts[0];
    transformed.lastName = nameParts.slice(1).join(' ') || nameParts[0];
    delete transformed.name;
  }
  
  return transformed;
};

export const getMembers = async (req, res) => {
  try {
    const { status, active, search } = req.query;
    
    // Filtre de base : membres de l'utilisateur connecté
    const filter = { createdBy: req.user.id }; // ← AJOUTÉ
    
    // Gestion du filtre de statut
    if (status) {
      filter.status = status;
    } else if (active === 'true') {
      filter.status = 'actif';  // ← GÉRÉ "active=true"
    } else if (active === 'false') {
      filter.status = { $ne: 'actif' };  // tous sauf actifs
    }
    
    // Recherche texte optionnelle
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const members = await Member.find(filter)
      .sort({ lastName: 1, firstName: 1 });
    
    console.log(`📋 ${members.length} membre(s) trouvé(s)`);
    res.json(members);
  } catch (error) {
    console.error('❌ Erreur getMembers:', error.message);
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
    
    console.log(`👤 Membre trouvé: ${member.firstName} ${member.lastName}`);
    res.json(member);
  } catch (error) {
    console.error('❌ Erreur getMemberById:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Créer un membre
export const createMember = async (req, res) => {
  try {
    console.log('📩 Données BRUTES reçues:', JSON.stringify(req.body, null, 2));
    
    // Transformer les données
    const transformedData = transformMemberData(req.body);
    console.log('🔄 Données TRANSFORMÉES:', JSON.stringify(transformedData, null, 2));
    
    const memberData = {
      ...transformedData,
      createdBy: req.user.id
    };
    
    const member = await Member.create(memberData);
    console.log(`✅ Membre créé: ${member.firstName} ${member.lastName} (${member._id})`);
    
    res.status(201).json(member);
  } catch (error) {
    console.error('❌ Erreur createMember:', error.message);
    console.error('📦 Données reçues:', JSON.stringify(req.body, null, 2));
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Cet email est déjà utilisé' 
      });
    }
    
    // Renvoyer plus de détails sur l'erreur
    res.status(400).json({ 
      message: error.message,
      errors: error.errors,
      receivedData: req.body,
      hint: 'Vérifiez que firstName, lastName et email sont bien envoyés'
    });
  }
};

// Mettre à jour un membre
export const updateMember = async (req, res) => {
  try {
    console.log(`📝 Mise à jour membre ${req.params.id}`);
    console.log('📩 Données reçues:', JSON.stringify(req.body, null, 2));
    
    // Transformer les données
    const transformedData = transformMemberData(req.body);
    console.log('🔄 Données transformées:', JSON.stringify(transformedData, null, 2));
    
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      transformedData,
      { new: true, runValidators: true }
    );
    
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }
    
    console.log(`✅ Membre mis à jour: ${member.firstName} ${member.lastName}`);
    res.json(member);
  } catch (error) {
    console.error('❌ Erreur updateMember:', error.message);
    res.status(400).json({ 
      message: error.message,
      receivedData: req.body
    });
  }
};

// Supprimer un membre
export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }
    
    console.log(`🗑️ Membre supprimé: ${member.firstName} ${member.lastName} (${member._id})`);
    res.json({ message: 'Membre supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur deleteMember:', error.message);
    res.status(500).json({ message: error.message });
  }
};
