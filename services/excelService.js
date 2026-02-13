import ExcelJS from 'exceljs';
import Member from '../models/Member.js';
import Cotisation from '../models/Cotisation.js';
import Attendance from '../models/Attendance.js';

/**
 * 📊 EXPORT EXCEL - Rapport mensuel complet
 */
export const exportMonthlyReport = async (month) => {
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = 'Worship Team Manager';
  workbook.created = new Date();
  
  const [year, monthNum] = month.split('-');
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthName = monthNames[parseInt(monthNum) - 1];

  // ============================================
  // FEUILLE 1: COTISATIONS
  // ============================================
  const cotisSheet = workbook.addWorksheet('Cotisations', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  // En-têtes
  cotisSheet.columns = [
    { header: 'Membre', key: 'membre', width: 25 },
    { header: 'Montant', key: 'montant', width: 12 },
    { header: 'Statut', key: 'statut', width: 12 },
    { header: 'Méthode', key: 'methodePaiement', width: 15 },
    { header: 'Date Paiement', key: 'datePaiement', width: 15 },
    { header: 'Notes', key: 'notes', width: 30 }
  ];

  // Style d'en-tête
  cotisSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  cotisSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }
  };
  cotisSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Données
  const cotisations = await Cotisation.find({ mois: month })
    .populate('membre', 'firstName lastName pseudo')
    .sort({ 'membre.lastName': 1 });

  let totalMontant = 0;
  let totalPaye = 0;

  cotisations.forEach(c => {
    const row = cotisSheet.addRow({
      membre: c.membre ? `${c.membre.firstName} ${c.membre.lastName} (${c.membre.pseudo})` : 'N/A',
      montant: c.montant,
      statut: c.statut === 'paye' ? 'Payé' : 'Non payé',
      methodePaiement: c.methodePaiement || '',
      datePaiement: c.datePaiement ? new Date(c.datePaiement).toLocaleDateString('fr-FR') : '',
      notes: c.notes || ''
    });

    // Formater le montant
    row.getCell('montant').numFmt = '#,##0 "Ar"';
    row.getCell('montant').alignment = { horizontal: 'right' };

    // Colorer selon le statut
    if (c.statut === 'paye') {
      row.getCell('statut').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4EDDA' }
      };
      row.getCell('statut').font = { color: { argb: 'FF155724' } };
      totalPaye += c.montant;
    } else {
      row.getCell('statut').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8D7DA' }
      };
      row.getCell('statut').font = { color: { argb: 'FF721C24' } };
    }

    totalMontant += c.montant;
  });

  // Ligne de total
  const totalRow = cotisSheet.addRow({
    membre: 'TOTAL',
    montant: totalMontant,
    statut: `${cotisations.filter(c => c.statut === 'paye').length}/${cotisations.length} payés`,
    methodePaiement: '',
    datePaiement: '',
    notes: ''
  });
  totalRow.font = { bold: true };
  totalRow.getCell('montant').numFmt = '#,##0 "Ar"';
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE9ECEF' }
  };

  // ============================================
  // FEUILLE 2: PRÉSENCES
  // ============================================
  const presSheet = workbook.addWorksheet('Présences', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  presSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Membre', key: 'membre', width: 25 },
    { header: 'Statut', key: 'statut', width: 12 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Heure arrivée', key: 'arrivalTime', width: 12 },
    { header: 'Motif', key: 'reason', width: 30 }
  ];

  // Style d'en-tête
  presSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  presSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }
  };
  presSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Données
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0);

  const attendance = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  })
    .populate('member', 'firstName lastName pseudo')
    .sort({ date: -1, 'member.lastName': 1 });

  attendance.forEach(a => {
    const row = presSheet.addRow({
      date: new Date(a.date).toLocaleDateString('fr-FR'),
      membre: a.member ? `${a.member.firstName} ${a.member.lastName} (${a.member.pseudo})` : 'N/A',
      statut: a.status === 'present' ? 'Présent' : 
              a.status === 'absent' ? 'Absent' :
              a.status === 'en_retard' ? 'En retard' : 'Excusé',
      type: a.type || 'Répétition',
      arrivalTime: a.arrivalTime || '',
      reason: a.reason || ''
    });

    // Colorer selon le statut
    switch (a.status) {
      case 'present':
        row.getCell('statut').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD4EDDA' }
        };
        break;
      case 'absent':
        row.getCell('statut').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8D7DA' }
        };
        break;
      case 'en_retard':
        row.getCell('statut').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF3CD' }
        };
        break;
    }
  });

  // ============================================
  // FEUILLE 3: STATISTIQUES
  // ============================================
  const statsSheet = workbook.addWorksheet('Statistiques');

  statsSheet.mergeCells('A1:B1');
  statsSheet.getCell('A1').value = `Rapport - ${monthName} ${year}`;
  statsSheet.getCell('A1').font = { size: 16, bold: true };
  statsSheet.getCell('A1').alignment = { horizontal: 'center' };

  // Statistiques cotisations
  statsSheet.getCell('A3').value = 'COTISATIONS';
  statsSheet.getCell('A3').font = { bold: true, size: 14 };
  statsSheet.getCell('A3').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }
  };
  statsSheet.getCell('A3').font.color = { argb: 'FFFFFFFF' };

  const cotisStats = [
    ['Total membres', cotisations.length],
    ['Cotisations payées', cotisations.filter(c => c.statut === 'paye').length],
    ['Cotisations non payées', cotisations.filter(c => c.statut === 'non_paye').length],
    ['Taux de paiement', `${((cotisations.filter(c => c.statut === 'paye').length / cotisations.length) * 100).toFixed(1)}%`],
    ['Montant total', `${totalMontant.toLocaleString()} Ar`],
    ['Montant collecté', `${totalPaye.toLocaleString()} Ar`],
    ['Montant restant', `${(totalMontant - totalPaye).toLocaleString()} Ar`]
  ];

  cotisStats.forEach((stat, index) => {
    const row = index + 4;
    statsSheet.getCell(`A${row}`).value = stat[0];
    statsSheet.getCell(`B${row}`).value = stat[1];
    statsSheet.getCell(`A${row}`).font = { bold: true };
  });

  // Statistiques présences
  const totalPresent = attendance.filter(a => a.status === 'present').length;
  const totalAbsent = attendance.filter(a => a.status === 'absent').length;
  const totalRetard = attendance.filter(a => a.status === 'en_retard').length;

  statsSheet.getCell('A12').value = 'PRÉSENCES';
  statsSheet.getCell('A12').font = { bold: true, size: 14 };
  statsSheet.getCell('A12').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }
  };
  statsSheet.getCell('A12').font.color = { argb: 'FFFFFFFF' };

  const attendStats = [
    ['Total enregistrements', attendance.length],
    ['Présents', totalPresent],
    ['Absents', totalAbsent],
    ['En retard', totalRetard],
    ['Taux de présence', attendance.length > 0 ? `${(((totalPresent + totalRetard) / attendance.length) * 100).toFixed(1)}%` : '0%']
  ];

  attendStats.forEach((stat, index) => {
    const row = index + 13;
    statsSheet.getCell(`A${row}`).value = stat[0];
    statsSheet.getCell(`B${row}`).value = stat[1];
    statsSheet.getCell(`A${row}`).font = { bold: true };
  });

  // Ajuster les colonnes
  statsSheet.getColumn('A').width = 30;
  statsSheet.getColumn('B').width = 20;

  return workbook;
};

/**
 * 📊 EXPORT EXCEL - Liste des membres
 */
export const exportMembersList = async (filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Membres', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  // En-têtes
  sheet.columns = [
    { header: 'Pseudo', key: 'pseudo', width: 15 },
    { header: 'Prénom', key: 'firstName', width: 20 },
    { header: 'Nom', key: 'lastName', width: 20 },
    { header: 'Genre', key: 'gender', width: 10 },
    { header: 'Âge', key: 'age', width: 8 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Téléphone', key: 'phone', width: 15 },
    { header: 'Rôle', key: 'role', width: 15 },
    { header: 'Instrument', key: 'instrument', width: 20 },
    { header: 'Statut', key: 'status', width: 12 },
    { header: 'Résidence', key: 'residence', width: 25 },
    { header: 'Date entrée', key: 'dateEntree', width: 15 }
  ];

  // Style d'en-tête
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }
  };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Données
  const members = await Member.find(filters).sort({ lastName: 1, firstName: 1 });

  members.forEach(m => {
    const row = sheet.addRow({
      pseudo: m.pseudo,
      firstName: m.firstName,
      lastName: m.lastName,
      gender: m.gender === 'homme' ? 'H' : 'F',
      age: m.age || '',
      email: m.email || '',
      phone: m.phone || '',
      role: m.role,
      instrument: m.instrument || '',
      status: m.status === 'actif' ? 'Actif' : m.status === 'en_pause' ? 'En pause' : 'Inactif',
      residence: m.residence || '',
      dateEntree: m.dateEntree ? new Date(m.dateEntree).toLocaleDateString('fr-FR') : ''
    });

    // Colorer selon le statut
    if (m.status === 'actif') {
      row.getCell('status').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4EDDA' }
      };
    } else if (m.status === 'en_pause') {
      row.getCell('status').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF3CD' }
      };
    } else {
      row.getCell('status').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE9ECEF' }
      };
    }
  });

  return workbook;
};

export default {
  exportMonthlyReport,
  exportMembersList
};
