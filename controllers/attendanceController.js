import Attendance from '../models/Attendance.js';
import Member from '../models/Member.js';

// NOUVELLE FONCTION - Obtenir toutes les présences de l'utilisateur
export const getAllAttendance = async (req, res) => {
  try {
    // Récupérer tous les membres de l'utilisateur
    const members = await Member.find({ 
      createdBy: req.user._id
    });
    const memberIds = members.map(m => m._id);

    // Récupérer toutes les présences de ces membres
    const attendance = await Attendance.find({
      member: { $in: memberIds }
    })
    .populate('member', 'firstName lastName email role instrument photo')
    .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('❌ getAllAttendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date requise' });
    }

    const members = await Member.find({ 
      createdBy: req.user._id,
      status: 'actif' 
    });
    const memberIds = members.map(m => m._id);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

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

export const getMemberAttendance = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { startDate, endDate } = req.query;

    const member = await Member.findOne({
      _id: memberId,
      createdBy: req.user._id
    });

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
      .sort({ date: -1 })
      .limit(100);

    res.json(attendance);
  } catch (error) {
    console.error('❌ getMemberAttendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const markAttendance = async (req, res) => {
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

    // Si excused, le motif est requis (obligatoire)
    if (status === 'excused' && !reason?.trim()) {
      return res.status(400).json({ 
        message: 'Un motif est requis pour une absence excusée' 
      });
    }

    // Pour absent, le motif est optionnel (pas de validation)

    // Si en retard, l'heure d'arrivée est recommandée
    if (status === 'en_retard' && !arrivalTime) {
      return res.status(400).json({ 
        message: 'L\'heure d\'arrivée est requise pour les retards' 
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
    ).populate('member', 'firstName lastName email role instrument');

    res.json(attendance);

  } catch (error) {
    console.error('❌ markAttendance error:', error);
    res.status(400).json({ message: error.message });
  }
};
