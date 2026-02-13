import Attendance from '../models/Attendance.js';
import Member from '../models/Member.js';

// ✅ NOUVEAU: Récupérer toutes les présences (avec filtres optionnels)
export const getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    let query = {};

    // Filtrer par plage de dates si fournie
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const attendanceQuery = Attendance.find(query)
      .populate('member', 'firstName lastName pseudo email role instrument photo')
      .sort({ date: -1 });

    // Limiter le nombre de résultats si spécifié
    if (limit) {
      attendanceQuery.limit(parseInt(limit));
    }

    const attendance = await attendanceQuery;

    res.json(attendance);
  } catch (error) {
    console.error('❌ getAllAttendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Enregistrer une présence
export const recordAttendance = async (req, res) => {
  try {
    const { memberId, date, status, reason, arrivalTime, type } = req.body;

    // Validation
    if (!memberId || !date || !status) {
      return res.status(400).json({ 
        message: 'memberId, date et status sont requis' 
      });
    }

    const validStatuses = ['present', 'absent', 'excused', 'en_retard'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Status doit être: ${validStatuses.join(', ')}` 
      });
    }

    // Si excused, le motif est requis
    if (status === 'excused' && !reason?.trim()) {
      return res.status(400).json({ 
        message: 'Un motif est requis pour une absence excusée' 
      });
    }

    // Si en retard, l'heure d'arrivée est recommandée
    if (status === 'en_retard' && !arrivalTime) {
      return res.status(400).json({ 
        message: 'L\'heure d\'arrivée est requise pour les retards' 
      });
    }

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(12, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
      { 
        member: memberId, 
        date: attendanceDate 
      },
      { 
        status,
        type: type || 'Répétition',
        reason: (status === 'absent' || status === 'excused') ? reason?.trim() : null,
        arrivalTime: (status === 'en_retard' || status === 'present') ? arrivalTime : null,
        markedBy: req.user._id 
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    ).populate('member', 'firstName lastName pseudo email role instrument photo');

    res.json(attendance);

  } catch (error) {
    console.error('❌ recordAttendance error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Obtenir les présences par date
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({ message: 'Date requise' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('member', 'firstName lastName pseudo email role instrument photo');

    res.json(attendance);
  } catch (error) {
    console.error('❌ getAttendanceByDate error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les présences d'un membre
export const getAttendanceByMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { startDate, endDate } = req.query;

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    let query = { member: memberId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query)
      .populate('member', 'firstName lastName pseudo email role instrument photo')
      .sort({ date: -1 })
      .limit(100);

    res.json(attendance);
  } catch (error) {
    console.error('❌ getAttendanceByMember error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une présence
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, arrivalTime, type } = req.body;

    const validStatuses = ['present', 'absent', 'excused', 'en_retard'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Status doit être: ${validStatuses.join(', ')}` 
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (type) updateData.type = type;
    if (reason !== undefined) updateData.reason = reason;
    if (arrivalTime !== undefined) updateData.arrivalTime = arrivalTime;
    updateData.markedBy = req.user._id;

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('member', 'firstName lastName pseudo email role instrument photo');

    if (!attendance) {
      return res.status(404).json({ message: 'Présence non trouvée' });
    }

    res.json(attendance);
  } catch (error) {
    console.error('❌ updateAttendance error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Supprimer une présence
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Attendance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Présence non trouvée' });
    }

    res.json({ message: 'Présence supprimée avec succès' });
  } catch (error) {
    console.error('❌ deleteAttendance error:', error);
    res.status(500).json({ message: error.message });
  }
};
