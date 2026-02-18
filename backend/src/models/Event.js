const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String },
  googlePhotosAlbumUrl: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  // Enhanced attendees with roles
  attendees: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { 
      type: String, 
      enum: ['organizer', 'participant'], 
      default: 'participant' 
    },
    status: { 
      type: String, 
      enum: ['invited', 'accepted', 'declined', 'tentative'], 
      default: 'invited' 
    },
    joinedAt: { type: Date }
  }],
  // Event visibility
  isPublic: { type: Boolean, default: false },
  // Capacity if needed
  maxAttendees: { type: Number },
  // Color coding
  color: { type: String, default: '#ff6b81' },
  // Event theme
  theme: { 
    type: String, 
    enum: ['birthday', 'meeting', 'dinner', 'celebration', 'katha', 'poojan'], 
    default: 'meeting' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
