import express from 'express';
import { protect } from '../middleware/auth.js';
import { exportLimiter } from '../middleware/rateLimiter.js';
import { exportMonthlyReport, exportMembersList } from '../services/excelService.js';

const router = express.Router();

router.use(protect);
router.use(exportLimiter);

// ============================================
// 📥 EXPORT EXCEL - Rapport mensuel
// ============================================
router.get('/excel/monthly/:month', async (req, res) => {
  try {
    const { month } = req.params;

    // Valider le format du mois
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ 
        message: 'Format de mois invalide. Utilisez YYYY-MM' 
      });
    }

    const workbook = await exportMonthlyReport(month);

    const [year, monthNum] = month.split('-');
    const filename = `Rapport-${monthNum}-${year}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

    console.log(`✅ Export Excel généré: ${filename}`);
  } catch (error) {
    console.error('❌ Erreur export Excel:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du fichier Excel' });
  }
});

// ============================================
// 📥 EXPORT EXCEL - Liste des membres
// ============================================
router.get('/excel/members', async (req, res) => {
  try {
    const { status } = req.query;
    
    const filters = {};
    if (status) filters.status = status;

    const workbook = await exportMembersList(filters);

    const statusSuffix = status ? `-${status}` : '';
    const filename = `Membres${statusSuffix}-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

    console.log(`✅ Export Excel généré: ${filename}`);
  } catch (error) {
    console.error('❌ Erreur export Excel:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du fichier Excel' });
  }
});

// ============================================
// 📥 EXPORT CSV - Cotisations
// ============================================
router.get('/csv/cotisations/:month', async (req, res) => {
  try {
    const { month } = req.params;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ 
        message: 'Format de mois invalide. Utilisez YYYY-MM' 
      });
    }

    const Cotisation = (await import('../models/Cotisation.js')).default;
    
    const cotisations = await Cotisation.find({ mois: month })
      .populate('membre', 'firstName lastName pseudo email')
      .sort({ 'membre.lastName': 1 });

    // Générer CSV
    const csvRows = [];
    csvRows.push('Membre,Email,Montant,Statut,Méthode,Date Paiement,Notes');

    cotisations.forEach(c => {
      const membre = c.membre ? `${c.membre.firstName} ${c.membre.lastName} (${c.membre.pseudo})` : 'N/A';
      const email = c.membre?.email || '';
      const montant = c.montant;
      const statut = c.statut === 'paye' ? 'Payé' : 'Non payé';
      const methode = c.methodePaiement || '';
      const date = c.datePaiement ? new Date(c.datePaiement).toLocaleDateString('fr-FR') : '';
      const notes = (c.notes || '').replace(/,/g, ';'); // Remplacer virgules pour CSV

      csvRows.push(`"${membre}","${email}",${montant},"${statut}","${methode}","${date}","${notes}"`);
    });

    const csvContent = csvRows.join('\n');
    const [year, monthNum] = month.split('-');
    const filename = `Cotisations-${monthNum}-${year}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // BOM UTF-8 pour Excel
    res.write('\uFEFF');
    res.write(csvContent);
    res.end();

    console.log(`✅ Export CSV généré: ${filename}`);
  } catch (error) {
    console.error('❌ Erreur export CSV:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du fichier CSV' });
  }
});

export default router;
