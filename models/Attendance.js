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
    // ← Seulement obligatoire si absent ou excused
    validate: {
      validator: function(v) {
        if (this.status === 'absent' || this.status === 'excused') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Un motif est requis pour les absences'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Index unique : un seul enregistrement par membre/date
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
