import Event from '../models/events.js';

// Obtenir tous les événements
export const getEvents = async (req, res) => {
  try {
    const { upcoming } = req.query;
    
    let filter = {};
    if (upcoming === 'true') {
      filter.date = { $gte: new Date() };
    }
    
    const events = await Event.find(filter)
      .populate('members.member', 'firstName lastName instrument')
      .sort({ date: 1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir un événement par ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('members.member', 'firstName lastName instrument email phone');
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer un événement
export const createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un événement
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('members.member', 'firstName lastName instrument');
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un événement
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
