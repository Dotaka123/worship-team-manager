import mongoose from 'mongoose';

const cotisationSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  mois: {
    type: String,
    required: true,
    // Format: "2026-02" pour Février 2026
  },
  montant: {
    type: Number,
    required: true,
    default: 3000
  },
  statut: {
    type: String,
    enum: ['payé', 'en_attente', 'en_retard'],
    default: 'en_attente'
  },
  datePaiement: {
    type: Date,
    default: null
  },
  methodePaiement: {
    type: String,
    enum: ['espèces', 'virement', 'mobile_money'],
    default: null
  },
  notes: {
    type: String,
    maxLength: 500,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index unique pour éviter les doublons
cotisationSchema.index({ member: 1, mois: 1, createdBy: 1 }, { unique: true });

export default mongoose.model('Cotisation', cotisationSchema);
