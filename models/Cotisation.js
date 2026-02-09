const mongoose = require('mongoose');

const cotisationSchema = new mongoose.Schema({
  membre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  mois: {
    type: String, // Format: "2024-01"
    required: true
  },
  montant: {
    type: Number,
    default: 3000
  },
  statut: {
    type: String,
    enum: ['paye', 'non_paye'],
    default: 'non_paye'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile_money', 'bank', 'other'],
    default: 'cash'
  },
  paidAt: {
    type: Date,
    default: null
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index unique pour éviter les doublons
cotisationSchema.index({ membre: 1, mois: 1 }, { unique: true });

module.exports = mongoose.model('Cotisation', cotisationSchema);
