import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'La date est requise']
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  },
  reason: {
    type: String,
    trim: true // Motif d'absence (optionnel)
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Index pour éviter les doublons (un membre, une date)
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
