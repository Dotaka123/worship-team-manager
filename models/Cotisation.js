import mongoose from 'mongoose';

const cotisationSchema = new mongoose.Schema({
  membre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  mois: {
    type: String,
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
    enum: ['cash', 'mobile_money', 'bank', null],
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

cotisationSchema.index({ membre: 1, mois: 1 }, { unique: true });

export default mongoose.model('Cotisation', cotisationSchema);
