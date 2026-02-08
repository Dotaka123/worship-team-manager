import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'La date est requise']
  },
  startTime: {
    type: String,
    required: [true, 'L\'heure de début est requise']
  },
  endTime: {
    type: String
  },
  location: {
    type: String,
    default: 'Église',
    trim: true
  },
  type: {
    type: String,
    enum: ['culte', 'répétition', 'événement_spécial'],
    default: 'culte'
  },
  members: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    confirmed: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index pour recherche par date
eventSchema.index({ date: -1 });
eventSchema.index({ type: 1 });

export default mongoose.model('Event', eventSchema);
