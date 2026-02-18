const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TripSchema = new Schema({
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  // Enhanced participants with roles
  participants: [{
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
  itinerary: [{ day: Number, activities: [String] }],
  // Trip details
  places: [{ type: String }],
  budget: { type: Number },
  description: { type: String },
  googlePhotosAlbumUrl: { type: String },
  // Trip visibility
  isPublic: { type: Boolean, default: false },
  // Color coding
  color: { type: String, default: '#1dd1a1' },
  // Trip theme
  theme: { 
    type: String, 
    enum: ['temple', 'trip', 'tour'], 
    default: 'trip' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trip', TripSchema);
