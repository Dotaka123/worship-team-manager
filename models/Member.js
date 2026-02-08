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
    required: [true, 'Le rôle est requis'],
    enum: [
      'Chanteur/Chanteuse',
      'Chef de louange',
      'Musicien',
      'Technicien son',
      'Technicien lumière',
      'Autre'
    ],
    default: 'Chanteur/Chanteuse'
  },
  instrument: {
    type: String,
    trim: true,
    enum: [
      'Chant lead',
      '1ère voix',
      '2ème voix',
      '3ème voix',
      'Chorale',
      'Guitare acoustique',
      'Guitare électrique',
      'Basse',
      'Batterie',
      'Clavier/Piano',
      'Synthé',
      'Saxophone',
      'Trompette',
      'Trombone',
      'Violon',
      'Djembé',
      'Percussions',
      'Sono',
      'Lumières',
      'Autre',
      ''  // Permet de ne rien sélectionner
    ]
  },
  groupe: {
    type: String,
    trim: true,
    enum: [
      'Louange principale',
      'Louange jeunes',
      'Chorale',
      'Orchestre',
      'Équipe technique',
      'Autre',
      ''
    ]
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
memberSchema.index({ role: 1 });

export default mongoose.model('Member', memberSchema);
