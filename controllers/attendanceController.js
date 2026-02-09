import Attendance from '../models/Attendance.js';
import Member from '../models/Member.js';

// Obtenir les présences par date
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date requise' });
    }

    // Récupérer les membres de l'utilisateur
    const members = await Member.find({ 
      createdBy: req.user._id,
      status: 'actif' 
    });
    const memberIds = members.map(m => m._id);

    // Récupérer les présences pour cette date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      member: { $in: memberIds },
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('member', 'name role');

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir l'historique d'un membre
export const getMemberAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      member: req.params.memberId
    }).sort({ date: -1 }).limit(20);

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer présence/absence
export const markAttendance = async (req, res) => {
  try {
    const { memberId, date, status, reason } = req.body;

    // Vérifier que le membre appartient à l'utilisateur
    const member = await Member.findOne({
      _id: memberId,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Créer ou mettre à jour la présence
    const attendanceDate = new Date(date);
    attendanceDate.setHours(12, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
      { member: memberId, date: attendanceDate },
      { 
        status, 
        reason: status === 'absent' ? reason : null,
        markedBy: req.user._id 
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
