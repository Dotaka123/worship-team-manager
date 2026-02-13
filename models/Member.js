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
  pseudo: {
    type: String,
    required: [true, 'Le pseudo est requis'],
    trim: true,
    unique: true,
    maxlength: [20, 'Le pseudo ne peut pas dépasser 20 caractères']
  },
  photo: {
    type: String,
    default: null
  },
  gender: {
    type: String,
    enum: ['homme', 'femme'],
    default: 'homme'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
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
    enum: ['Chanteur', 'Musicien', 'Technicien'],
    default: 'Musicien'
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
  dateEntree: {
    type: Date,
    default: new Date()
  },
  notesAccompagnement: {
    type: String,
    trim: true,
    maxlength: 500,
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

// Index sparse - ignore les valeurs null
memberSchema.index(
  { email: 1 }, 
  { unique: true, sparse: true, partialFilterExpression: { email: { $type: "string" } } }
);

// Méthode virtuelle pour obtenir le nom complet
memberSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Méthode virtuelle pour obtenir le nom d'affichage (pseudo prioritaire)
memberSchema.virtual('displayName').get(function() {
  return this.pseudo;
});

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

// S'assurer que les virtuels sont inclus dans les conversions JSON
memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

export default mongoose.model('Member', memberSchema);
