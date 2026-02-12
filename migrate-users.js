import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const migrateExistingUsers = async () => {
  try {
    console.log('\n🔄 === Migration des Utilisateurs Existants ===\n');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Compter les utilisateurs
    const totalUsers = await User.countDocuments();
    console.log(`📊 Nombre total d'utilisateurs: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log('\n💡 Aucun utilisateur à migrer. La base de données est vide.\n');
      process.exit(0);
    }

    // Trouver tous les utilisateurs
    const users = await User.find();

    console.log('\n📋 Analyse des utilisateurs:\n');

    let updatedCount = 0;
    let alreadyOkCount = 0;

    for (const user of users) {
      // Si le rôle est 'responsable' ou n'existe pas, le convertir en 'viewer'
      // SAUF si vous voulez garder certains utilisateurs en tant que responsables
      
      const oldRole = user.role;
      
      if (!user.role || !['viewer', 'responsable', 'admin'].includes(user.role)) {
        // Rôle invalide ou inexistant -> viewer par défaut
        user.role = 'viewer';
        await user.save();
        console.log(`✅ ${user.name} (${user.email}): ${oldRole || 'undefined'} -> viewer`);
        updatedCount++;
      } else if (user.role === 'responsable') {
        // Les responsables existants RESTENT responsables
        // Si vous voulez les convertir en viewer, décommentez les lignes suivantes:
        // user.role = 'viewer';
        // await user.save();
        // console.log(`✅ ${user.name} (${user.email}): responsable -> viewer`);
        // updatedCount++;
        
        console.log(`⏭️  ${user.name} (${user.email}): Déjà responsable (conservé)`);
        alreadyOkCount++;
      } else {
        console.log(`⏭️  ${user.name} (${user.email}): Déjà ${user.role} (conservé)`);
        alreadyOkCount++;
      }
    }

    console.log('\n════════════════════════════════════════');
    console.log('✅ Migration terminée !');
    console.log('════════════════════════════════════════');
    console.log(`📊 Utilisateurs mis à jour: ${updatedCount}`);
    console.log(`✅ Utilisateurs OK: ${alreadyOkCount}`);
    console.log(`📈 Total: ${totalUsers}`);

    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Vérifiez les rôles dans votre base de données');
    console.log('   2. Utilisez setup-admin.js pour créer votre premier admin');
    console.log('   3. Connectez-vous en tant qu\'admin pour promouvoir d\'autres utilisateurs\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

migrateExistingUsers();
