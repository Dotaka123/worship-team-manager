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
    trim: true,
    lowercase: true,
    sparse: true, // Permet les valeurs null/vides
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  age: {
    type: Number,
    default: null
  },
  residence: {
    type: String,
    trim: true,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  role: {
    type: String,
    enum: ['musician', 'singer', 'director', 'other'],
    default: 'other'
  },
  instrument: {
    type: String,
    trim: true,
    default: null
  },
  status: {
    type: String,
    enum: ['actif', 'inactif', 'en_pause'],
    default: 'actif'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true 
});

// Middleware pour calculer l'âge automatiquement
memberSchema.pre('save', function(next) {
  if (this.dateOfBirth) {
    const today = new Date();
    let age = today.getFullYear() - this.dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
      age--;
    }
    
    this.age = age;
  }
  next();
});

export default mongoose.model('Member', memberSchema);
