import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  role: {
    type: String,
    enum: ['chanteur', 'musicien', 'technicien'],
    required: [true, 'Le rôle est requis']
  },
  instrument: {
    type: String,
    trim: true // Ex: guitare, piano, batterie (optionnel)
  },
  group: {
    type: String,
    trim: true // Ex: "Équipe A", "Dimanche matin"
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Member', memberSchema);
