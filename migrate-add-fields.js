import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';
import User from './models/User.js';

dotenv.config();

// Fonction pour générer un pseudo unique à partir du nom et prénom
const generatePseudo = (firstName, lastName, existingPseudos) => {
  // Nettoyer et formatter
  const cleanFirst = firstName.toLowerCase().replace(/\s+/g, '');
  const cleanLast = lastName.toLowerCase().replace(/\s+/g, '');
  
  // Option 1: Première lettre prénom + nom
  let pseudo = `${cleanFirst[0]}${cleanLast}`;
  
  // Si déjà pris, essayer prénom complet + nom
  if (existingPseudos.has(pseudo)) {
    pseudo = `${cleanFirst}${cleanLast}`;
  }
  
  // Si encore pris, ajouter un chiffre
  let counter = 1;
  let finalPseudo = pseudo;
  while (existingPseudos.has(finalPseudo)) {
    finalPseudo = `${pseudo}${counter}`;
    counter++;
  }
  
  // Limiter à 20 caractères
  finalPseudo = finalPseudo.substring(0, 20);
  
  return finalPseudo;
};

const migrate = async () => {
  try {
    console.log('🚀 Démarrage de la migration...');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Migration 1: Ajouter canEdit à tous les utilisateurs
    console.log('\n📝 Migration 1: Ajout du champ canEdit aux utilisateurs...');
    const usersWithoutCanEdit = await User.find({ canEdit: { $exists: false } });
    
    if (usersWithoutCanEdit.length > 0) {
      for (const user of usersWithoutCanEdit) {
        user.canEdit = false; // Par défaut, personne ne peut modifier
        await user.save({ validateBeforeSave: false });
        console.log(`   ✓ canEdit ajouté pour ${user.email} (${user.canEdit})`);
      }
      console.log(`✅ ${usersWithoutCanEdit.length} utilisateur(s) migré(s)`);
    } else {
      console.log('ℹ️  Tous les utilisateurs ont déjà le champ canEdit');
    }
    
    // Migration 2: Ajouter pseudo aux membres
    console.log('\n📝 Migration 2: Ajout du champ pseudo aux membres...');
    const membersWithoutPseudo = await Member.find({ pseudo: { $exists: false } });
    
    if (membersWithoutPseudo.length > 0) {
      const existingPseudos = new Set();
      
      // Récupérer les pseudos déjà existants
      const membersWithPseudo = await Member.find({ pseudo: { $exists: true } });
      membersWithPseudo.forEach(m => existingPseudos.add(m.pseudo));
      
      for (const member of membersWithoutPseudo) {
        const pseudo = generatePseudo(member.firstName, member.lastName, existingPseudos);
        member.pseudo = pseudo;
        existingPseudos.add(pseudo);
        
        try {
          await member.save({ validateBeforeSave: false });
          console.log(`   ✓ Pseudo "${pseudo}" ajouté pour ${member.firstName} ${member.lastName}`);
        } catch (error) {
          if (error.code === 11000) {
            // Conflit de pseudo, réessayer avec un suffixe
            const newPseudo = `${pseudo}${Math.floor(Math.random() * 1000)}`;
            member.pseudo = newPseudo;
            await member.save({ validateBeforeSave: false });
            console.log(`   ✓ Pseudo "${newPseudo}" ajouté pour ${member.firstName} ${member.lastName} (conflit résolu)`);
          } else {
            throw error;
          }
        }
      }
      console.log(`✅ ${membersWithoutPseudo.length} membre(s) migré(s)`);
    } else {
      console.log('ℹ️  Tous les membres ont déjà un pseudo');
    }
    
    console.log('\n✅ Migration terminée avec succès !');
    console.log('\n📋 Résumé:');
    console.log(`   - Utilisateurs totaux: ${await User.countDocuments()}`);
    console.log(`   - Membres totaux: ${await Member.countDocuments()}`);
    
    // Afficher quelques exemples
    console.log('\n📌 Exemples de membres avec pseudo:');
    const sampleMembers = await Member.find().limit(5);
    sampleMembers.forEach(m => {
      console.log(`   - ${m.firstName} ${m.lastName} → pseudo: "${m.pseudo}"`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
};

migrate();
