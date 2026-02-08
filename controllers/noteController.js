import Note from '../models/Note.js';
import Member from '../models/Member.js';

// Obtenir les notes d'un membre
export const getMemberNotes = async (req, res) => {
  try {
    // Vérifier que le membre appartient à l'utilisateur
    const member = await Member.findOne({
      _id: req.params.memberId,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const notes = await Note.find({ member: req.params.memberId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ajouter une note
export const createNote = async (req, res) => {
  try {
    const { memberId, content } = req.body;

    // Vérifier que le membre appartient à l'utilisateur
    const member = await Member.findOne({
      _id: memberId,
      createdBy: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const note = await Note.create({
      member: memberId,
      content,
      createdBy: req.user._id
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer une note
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!note) {
      return res.status(404).json({ message: 'Note non trouvée' });
    }

    res.json({ message: 'Note supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
