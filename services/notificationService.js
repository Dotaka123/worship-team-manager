import Mailjet from 'node-mailjet';
import Member from '../models/Member.js';
import Cotisation from '../models/Cotisation.js';
import Attendance from '../models/Attendance.js';

// Vérifier que les clés sont configurées
const isMailjetConfigured = process.env.MAILJET_API_KEY && 
                           process.env.MAILJET_API_SECRET && 
                           process.env.MAILJET_API_KEY !== 'MJ_APIKEY_PUBLIC';

let mailjet = null;

if (isMailjetConfigured) {
  mailjet = new Mailjet({
    apiKey: process.env.MAILJET_API_KEY,
    apiSecret: process.env.MAILJET_API_SECRET
  });
  console.log('✅ Mailjet configuré et activé');
} else {
  console.warn('⚠️  Mailjet NON configuré - Les emails ne seront pas envoyés (mode développement)');
}

/**
 * Envoie un email avec timeout et gestion d'erreurs améliorée
 */
const sendEmailWithTimeout = async (emailData, timeoutMs = 10000) => {
  if (!isMailjetConfigured) {
    console.log('📧 [MODE DEV] Email simulé:', emailData.Messages[0].Subject, 'vers', emailData.Messages[0].To[0].Email);
    return { success: true, mode: 'development' };
  }

  return Promise.race([
    mailjet.post('send', { version: 'v3.1' }).request(emailData),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout lors de l\'envoi de l\'email')), timeoutMs)
    )
  ]);
};

/**
 * Template HTML de base
 */
const getEmailTemplate = (title, content, ctaText = null, ctaUrl = null) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 40px;
          text-align: center;
        }
        .content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          margin-top: 20px;
          text-align: left;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 12px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
        }
        h1 {
          color: white;
          margin: 0;
          font-size: 28px;
        }
        h2 {
          color: #333;
          margin-top: 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          color: white;
          margin-top: 20px;
          font-size: 14px;
          opacity: 0.9;
        }
        .highlight {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .success {
          background: #d4edda;
          border-left: 4px solid #28a745;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .table th, .table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        .table th {
          background: #f8f9fa;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🎵</div>
        <h1>${title}</h1>
        
        <div class="content">
          ${content}
          ${ctaText && ctaUrl ? `<div style="text-align: center;"><a href="${ctaUrl}" class="btn">${ctaText}</a></div>` : ''}
        </div>
        
        <div class="footer">
          <p>Worship Team Manager - Gestion de votre équipe de louange</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * 📧 RAPPEL DE COTISATION IMPAYÉE
 */
export const sendCotisationReminder = async (member, cotisation) => {
  if (!member.email) {
    console.log(`⚠️ Membre ${member.pseudo} n'a pas d'email configuré`);
    return { success: false, reason: 'no_email' };
  }

  const [year, month] = cotisation.mois.split('-');
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthName = monthNames[parseInt(month) - 1];

  const content = `
    <h2>Bonjour ${member.firstName} 👋</h2>
    <p>Ceci est un rappel amical concernant votre cotisation mensuelle.</p>
    
    <div class="highlight">
      <strong>Mois :</strong> ${monthName} ${year}<br>
      <strong>Montant :</strong> ${cotisation.montant.toLocaleString()} Ar<br>
      <strong>Statut :</strong> Non payé
    </div>
    
    <p>Nous vous remercions de bien vouloir régulariser votre situation dès que possible.</p>
    
    <p><strong>Moyens de paiement acceptés :</strong></p>
    <ul>
      <li>💵 Espèces</li>
      <li>📱 Mobile Money</li>
      <li>🏦 Virement bancaire</li>
      <li>💳 Chèque</li>
    </ul>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      En cas de difficultés, n'hésitez pas à contacter l'administration.
    </p>
  `;

  try {
    await sendEmailWithTimeout({
      Messages: [{
        From: {
          Email: process.env.MAILJET_FROM_EMAIL || 'hugoasmin@gmail.com',
          Name: 'Worship Team Manager'
        },
        To: [{
          Email: member.email,
          Name: `${member.firstName} ${member.lastName}`
        }],
        Subject: `Rappel - Cotisation ${monthName} ${year}`,
        HTMLPart: getEmailTemplate('Rappel de Cotisation', content)
      }]
    });

    console.log(`✅ Rappel envoyé à ${member.email} pour ${cotisation.mois}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur envoi rappel à ${member.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 📧 NOTIFICATION DE PAIEMENT CONFIRMÉ
 */
export const sendPaymentConfirmation = async (member, cotisation) => {
  if (!member.email) return { success: false, reason: 'no_email' };

  const [year, month] = cotisation.mois.split('-');
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthName = monthNames[parseInt(month) - 1];

  const content = `
    <h2>Merci ${member.firstName} ! 🎉</h2>
    <p>Nous avons bien reçu votre paiement.</p>
    
    <div class="success">
      <strong>Mois :</strong> ${monthName} ${year}<br>
      <strong>Montant payé :</strong> ${cotisation.montant.toLocaleString()} Ar<br>
      <strong>Méthode :</strong> ${cotisation.methodePaiement || 'Non spécifiée'}<br>
      <strong>Date :</strong> ${cotisation.datePaiement ? new Date(cotisation.datePaiement).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
    </div>
    
    <p>Votre contribution nous aide à faire avancer le ministère de louange. Que Dieu vous bénisse ! 🙏</p>
  `;

  try {
    await sendEmailWithTimeout({
      Messages: [{
        From: {
          Email: process.env.MAILJET_FROM_EMAIL || 'hugoasmin@gmail.com',
          Name: 'Worship Team Manager'
        },
        To: [{
          Email: member.email,
          Name: `${member.firstName} ${member.lastName}`
        }],
        Subject: `Paiement confirmé - ${monthName} ${year}`,
        HTMLPart: getEmailTemplate('Paiement Confirmé', content)
      }]
    });

    console.log(`✅ Confirmation envoyée à ${member.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur envoi confirmation:`, error.message);
    return { success: false };
  }
};

/**
 * 📧 ALERTE ABSENCES RÉPÉTÉES
 */
export const sendAbsenceAlert = async (member, absenceCount, totalEvents) => {
  if (!member.email) return { success: false, reason: 'no_email' };

  const tauxAbsence = ((absenceCount / totalEvents) * 100).toFixed(1);

  const content = `
    <h2>Bonjour ${member.firstName} 👋</h2>
    <p>Nous avons remarqué que vous avez été absent(e) à plusieurs reprises récemment.</p>
    
    <div class="warning">
      <strong>Sur les 30 derniers jours :</strong><br>
      Absences : ${absenceCount} sur ${totalEvents} événements (${tauxAbsence}%)
    </div>
    
    <p>Nous comprenons que des imprévus peuvent survenir. Si vous rencontrez des difficultés ou avez besoin d'un ajustement de votre planning, n'hésitez pas à en parler avec les responsables.</p>
    
    <p>Votre présence et votre contribution sont importantes pour l'équipe ! 🙏</p>
  `;

  try {
    await sendEmailWithTimeout({
      Messages: [{
        From: {
          Email: process.env.MAILJET_FROM_EMAIL || 'hugoasmin@gmail.com',
          Name: 'Worship Team Manager'
        },
        To: [{
          Email: member.email,
          Name: `${member.firstName} ${member.lastName}`
        }],
        Subject: 'Suivi de présence - Worship Team',
        HTMLPart: getEmailTemplate('Suivi de Présence', content)
      }]
    });

    console.log(`✅ Alerte absence envoyée à ${member.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur envoi alerte:`, error.message);
    return { success: false };
  }
};

/**
 * 📧 RAPPORT MENSUEL POUR LES ADMINS
 */
export const sendMonthlyReport = async (adminEmail, adminName, reportData) => {
  const { month, stats, topPerformers, unpaidMembers } = reportData;

  const content = `
    <h2>Rapport Mensuel - ${month}</h2>
    
    <h3>📊 Statistiques Générales</h3>
    <table class="table">
      <tr>
        <th>Indicateur</th>
        <th>Valeur</th>
      </tr>
      <tr>
        <td>Membres actifs</td>
        <td>${stats.activeMembers}</td>
      </tr>
      <tr>
        <td>Cotisations payées</td>
        <td>${stats.paidCotisations} / ${stats.totalCotisations}</td>
      </tr>
      <tr>
        <td>Taux de paiement</td>
        <td>${stats.paymentRate}%</td>
      </tr>
      <tr>
        <td>Montant collecté</td>
        <td>${stats.totalAmount.toLocaleString()} Ar</td>
      </tr>
      <tr>
        <td>Taux de présence moyen</td>
        <td>${stats.averageAttendance}%</td>
      </tr>
    </table>
    
    ${topPerformers.length > 0 ? `
      <h3>⭐ Top Présences</h3>
      <ul>
        ${topPerformers.map(p => `<li>${p.name} - ${p.rate}%</li>`).join('')}
      </ul>
    ` : ''}
    
    ${unpaidMembers.length > 0 ? `
      <div class="warning">
        <h3>⚠️ Cotisations impayées (${unpaidMembers.length})</h3>
        <ul>
          ${unpaidMembers.slice(0, 10).map(m => `<li>${m.name}</li>`).join('')}
          ${unpaidMembers.length > 10 ? `<li>... et ${unpaidMembers.length - 10} autres</li>` : ''}
        </ul>
      </div>
    ` : ''}
  `;

  try {
    await sendEmailWithTimeout({
      Messages: [{
        From: {
          Email: process.env.MAILJET_FROM_EMAIL || 'hugoasmin@gmail.com',
          Name: 'Worship Team Manager'
        },
        To: [{
          Email: adminEmail,
          Name: adminName
        }],
        Subject: `📊 Rapport Mensuel - ${month}`,
        HTMLPart: getEmailTemplate('Rapport Mensuel', content, 'Voir le dashboard', `${process.env.FRONTEND_URL}/statistics`)
      }]
    });

    console.log(`✅ Rapport mensuel envoyé à ${adminEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur envoi rapport:`, error.message);
    return { success: false };
  }
};

/**
 * 🔄 TÂCHE AUTOMATIQUE - Rappels de cotisations
 * À exécuter le 15 de chaque mois
 */
export const sendBulkCotisationReminders = async (mois) => {
  try {
    const unpaidCotisations = await Cotisation.find({
      mois,
      statut: 'non_paye'
    }).populate('membre', 'firstName lastName email pseudo');

    let successCount = 0;
    let failCount = 0;

    for (const cotisation of unpaidCotisations) {
      if (cotisation.membre && cotisation.membre.email) {
        const result = await sendCotisationReminder(cotisation.membre, cotisation);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
        
        // Délai entre chaque email pour éviter le spam
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`📧 Rappels envoyés : ${successCount} réussis, ${failCount} échecs`);
    return { success: true, sent: successCount, failed: failCount };
  } catch (error) {
    console.error('❌ Erreur envoi rappels groupés:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🔄 TÂCHE AUTOMATIQUE - Alertes absences
 * À exécuter chaque semaine
 */
export const checkAndSendAbsenceAlerts = async () => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const absenceStats = await Attendance.aggregate([
      { $match: { date: { $gte: oneMonthAgo } } },
      {
        $group: {
          _id: '$member',
          total: { $sum: 1 },
          absences: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          }
        }
      },
      {
        $match: {
          total: { $gte: 4 },
          absences: { $gte: 3 }
        }
      }
    ]);

    let alertsSent = 0;

    for (const stat of absenceStats) {
      const member = await Member.findById(stat._id);
      if (member && member.email && member.status === 'actif') {
        await sendAbsenceAlert(member, stat.absences, stat.total);
        alertsSent++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`📧 ${alertsSent} alertes d'absence envoyées`);
    return { success: true, sent: alertsSent };
  } catch (error) {
    console.error('❌ Erreur vérification absences:', error);
    return { success: false };
  }
};

export default {
  sendCotisationReminder,
  sendPaymentConfirmation,
  sendAbsenceAlert,
  sendMonthlyReport,
  sendBulkCotisationReminders,
  checkAndSendAbsenceAlerts
};
