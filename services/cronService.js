import cron from 'node-cron';
import { 
  sendBulkCotisationReminders, 
  checkAndSendAbsenceAlerts 
} from './notificationService.js';

/**
 * Configuration des tâches automatiques (Cron jobs)
 */

/**
 * 📧 RAPPELS DE COTISATIONS
 * S'exécute le 15 de chaque mois à 9h00
 */
export const scheduleCotisationReminders = () => {
  // Format: seconde minute heure jour mois jour-semaine
  cron.schedule('0 9 15 * *', async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log(`🔔 Tâche automatique: Envoi des rappels de cotisations pour ${currentMonth}`);
    
    try {
      const result = await sendBulkCotisationReminders(currentMonth);
      console.log(`✅ Rappels envoyés: ${result.sent} réussis, ${result.failed} échecs`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi des rappels:', error);
    }
  }, {
    timezone: "Indian/Antananarivo" // Madagascar timezone
  });

  console.log('✅ Tâche automatique activée: Rappels cotisations (15 de chaque mois à 9h)');
};

/**
 * 📊 ALERTES ABSENCES RÉPÉTÉES
 * S'exécute tous les lundis à 10h00
 */
export const scheduleAbsenceAlerts = () => {
  // Tous les lundis (1) à 10h00
  cron.schedule('0 10 * * 1', async () => {
    console.log('🔔 Tâche automatique: Vérification des absences répétées');
    
    try {
      const result = await checkAndSendAbsenceAlerts();
      console.log(`✅ Alertes envoyées: ${result.sent} membres contactés`);
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des absences:', error);
    }
  }, {
    timezone: "Indian/Antananarivo"
  });

  console.log('✅ Tâche automatique activée: Alertes absences (tous les lundis à 10h)');
};

/**
 * 🧹 NETTOYAGE DES TOKENS EXPIRÉS
 * S'exécute tous les jours à 2h00
 */
export const scheduleTokenCleanup = () => {
  cron.schedule('0 2 * * *', async () => {
    console.log('🔔 Tâche automatique: Nettoyage des tokens expirés');
    
    try {
      const User = (await import('../models/User.js')).default;
      
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const result = await User.updateMany(
        {
          isVerified: false,
          emailVerificationToken: { $ne: null },
          createdAt: { $lt: oneDayAgo }
        },
        {
          $set: {
            emailVerificationToken: null,
            emailVerificationExpires: null
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ ${result.modifiedCount} tokens expirés nettoyés`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
  }, {
    timezone: "Indian/Antananarivo"
  });

  console.log('✅ Tâche automatique activée: Nettoyage tokens (tous les jours à 2h)');
};

/**
 * 📊 RAPPORT MENSUEL AUTOMATIQUE
 * S'exécute le 1er de chaque mois à 8h00
 */
export const scheduleMonthlyReport = () => {
  cron.schedule('0 8 1 * *', async () => {
    console.log('🔔 Tâche automatique: Génération du rapport mensuel');
    
    try {
      const User = (await import('../models/User.js')).default;
      const Cotisation = (await import('../models/Cotisation.js')).default;
      const Member = (await import('../models/Member.js')).default;
      const Attendance = (await import('../models/Attendance.js')).default;
      const { sendMonthlyReport } = await import('./notificationService.js');

      // Mois précédent
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const month = lastMonth.toISOString().slice(0, 7);

      // Récupérer les stats
      const [
        activeMembers,
        cotisations,
        attendance
      ] = await Promise.all([
        Member.countDocuments({ status: 'actif' }),
        Cotisation.find({ mois: month }),
        Attendance.find({
          date: {
            $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            $lt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1)
          }
        })
      ]);

      const paidCotisations = cotisations.filter(c => c.statut === 'paye').length;
      const totalAmount = cotisations
        .filter(c => c.statut === 'paye')
        .reduce((sum, c) => sum + c.montant, 0);

      const totalAttendance = attendance.length;
      const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'en_retard').length;

      const reportData = {
        month,
        stats: {
          activeMembers,
          totalCotisations: cotisations.length,
          paidCotisations,
          paymentRate: cotisations.length > 0 
            ? Math.round((paidCotisations / cotisations.length) * 100) 
            : 0,
          totalAmount,
          averageAttendance: totalAttendance > 0
            ? Math.round((presentCount / totalAttendance) * 100)
            : 0
        },
        topPerformers: [], // À implémenter si besoin
        unpaidMembers: cotisations
          .filter(c => c.statut === 'non_paye')
          .map(c => ({ name: c.membre?.pseudo || 'N/A' }))
      };

      // Envoyer aux admins
      const admins = await User.find({ role: 'admin', isVerified: true });
      
      for (const admin of admins) {
        await sendMonthlyReport(
          admin.email,
          `${admin.firstName} ${admin.lastName}`,
          reportData
        );
      }

      console.log(`✅ Rapports mensuels envoyés à ${admins.length} admins`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport:', error);
    }
  }, {
    timezone: "Indian/Antananarivo"
  });

  console.log('✅ Tâche automatique activée: Rapport mensuel (1er du mois à 8h)');
};

/**
 * 🎯 TÂCHE DE TEST (désactivée par défaut)
 * Pour tester les cron jobs sans attendre
 */
export const scheduleTestTask = () => {
  // Toutes les minutes (à activer uniquement en dev)
  // cron.schedule('* * * * *', () => {
  //   console.log('🧪 Test cron - exécuté à:', new Date().toLocaleString());
  // });
};

/**
 * Initialiser toutes les tâches automatiques
 */
export const initializeCronJobs = () => {
  console.log('\n📅 Initialisation des tâches automatiques...');
  
  scheduleCotisationReminders();
  scheduleAbsenceAlerts();
  scheduleTokenCleanup();
  scheduleMonthlyReport();
  
  console.log('✅ Toutes les tâches automatiques sont actives\n');
};

export default {
  initializeCronJobs,
  scheduleCotisationReminders,
  scheduleAbsenceAlerts,
  scheduleTokenCleanup,
  scheduleMonthlyReport,
  scheduleTestTask
};
