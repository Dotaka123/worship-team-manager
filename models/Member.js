import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    trim: true,
    default: 'Membre'
  },
  instrument: {
    type: String,
    trim: true
  },
  groupe: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['actif', 'inactif', 'en_pause'],
    default: 'actif'
  },
  dateEntree: {
    type: Date,
    default: Date.now
  },
  notesAccompagnement: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index pour recherche rapide
memberSchema.index({ firstName: 1, lastName: 1 });
memberSchema.index({ status: 1 });
memberSchema.index({ email: 1 });

export default mongoose.model('Member', memberSchema);
