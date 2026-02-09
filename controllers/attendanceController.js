import Attendance from '../models/Attendance.js';
import Member from '../models/Member.js';

// Obtenir les présences par date
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date requise' });
    }

    // Récupérer les membres actifs de l'utilisateur
    const members = await Member.find({ 
      createdBy: req.user._id,
      status: 'actif' 
    });
    const memberIds = members.map(m => m._id);

    // Convertir la date correctement
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Récupérer les présences pour cette date
    const attendance = await Attendance.find({
      member: { $in: memberIds },
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('member', 'firstName lastName email role instrument');

    res.json(attendance);
  } catch (error) {
    console.error('❌ getAttendanceByDate error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtenir l'historique d'un membre
export const getMemberAttendance = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { startDate, endDate } = req.query;

    // Vérifier que le membre appartient à l'utilisateur
    const member = await Member.findOne({
      _id: memberId,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    let query = { member: memberId };

    // Filtrer par plage de dates si fournie
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(100);

    res.json(attendance);
  } catch (error) {
    console.error('❌ getMemberAttendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Marquer présence/absence
export const markAttendance = async (req, res) => {
  try {
    const { memberId, date, status, reason } = req.body;

    // Validation
    if (!memberId || !date || !status) {
      return res.status(400).json({ 
        message: 'memberId, date et status sont requis' 
      });
    }

    // Valider le status
    const validStatuses = ['present', 'absent', 'excused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Status doit être: ${validStatuses.join(', ')}` 
      });
    }

    // Vérifier que le membre appartient à l'utilisateur
    const member = await Member.findOne({
      _id: memberId,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Si absent ou excused, le motif est requis
    if ((status === 'absent' || status === 'excused') && !reason?.trim()) {
      return res.status(400).json({ 
        message: 'Un motif est requis pour cette absence' 
      });
    }

    // Convertir la date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(12, 0, 0, 0);

    // Créer ou mettre à jour
    const attendance = await Attendance.findOneAndUpdate(
      { 
        member: memberId, 
        date: attendanceDate 
      },
      { 
        status,
        reason: status === 'present' ? null : reason?.trim(),
        markedBy: req.user._id 
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    ).populate('member', 'firstName lastName email role instrument');

    res.json(attendance);

  } catch (error) {
    console.error('❌ markAttendance error:', error);
    res.status(400).json({ message: error.message });
  }
};
