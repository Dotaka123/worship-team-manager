import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const setupFirstAdmin = async () => {
  try {
    console.log('\n🎵 === Configuration du Premier Administrateur ===\n');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Demander l'email
    const adminEmail = await question('📧 Entrez l\'email du compte à promouvoir en admin: ');

    if (!adminEmail || !adminEmail.includes('@')) {
      console.log('\n❌ Email invalide');
      process.exit(1);
    }

    // Chercher l'utilisateur
    const user = await User.findOne({ email: adminEmail.toLowerCase().trim() });

    if (!user) {
      console.log('\n❌ Aucun utilisateur trouvé avec cet email');
      console.log('💡 Assurez-vous que le compte a été créé via l\'interface web');
      console.log('💡 Ou créez d\'abord un compte avant d\'exécuter ce script\n');
      process.exit(1);
    }

    // Afficher les infos de l'utilisateur
    console.log('\n👤 Utilisateur trouvé:');
    console.log(`   Nom: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle actuel: ${user.role}`);

    if (user.role === 'admin') {
      console.log('\n✅ Cet utilisateur est déjà administrateur\n');
      process.exit(0);
    }

    // Confirmation
    const confirm = await question('\n⚠️  Voulez-vous promouvoir cet utilisateur en ADMIN? (oui/non): ');

    if (confirm.toLowerCase() !== 'oui') {
      console.log('\n❌ Opération annulée\n');
      process.exit(0);
    }

    // Promouvoir en admin
    user.role = 'admin';
    await user.save();

    console.log('\n✅ ═══════════════════════════════════════════════');
    console.log('✅ Utilisateur promu en ADMINISTRATEUR avec succès!');
    console.log('✅ ═══════════════════════════════════════════════');
    console.log(`\n👤 Nom: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Rôle: ${user.role}`);
    console.log('\n💡 Vous pouvez maintenant vous connecter et gérer les autres utilisateurs\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
};

setupFirstAdmin();
