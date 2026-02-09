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
    enum: ['present', 'absent', 'excused'],
    required: true
  },
  reason: {
    type: String,
    trim: true,
    default: null
    // ← Pas de validation ici, c'est fait dans le contrôleur
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Index unique : un seul enregistrement par membre/date
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

export default mongoose.model('Attendance', attendanceSchema);
