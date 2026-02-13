import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'excused', 'en_retard'],
    required: true
  },
  type: {
    type: String,
    default: 'Répétition', // 'Répétition', 'Culte', ou personnalisé
    trim: true
  },
  arrivalTime: {
    type: String, // Format: "HH:mm"
    default: null
  },
  reason: {
    type: String,
    trim: true,
    default: null
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Index
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

export default mongoose.model('Attendance', attendanceSchema);
