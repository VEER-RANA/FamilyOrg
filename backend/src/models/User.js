const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // Optional mobile number
  mobile: { type: String, required: false },
  password: { type: String, required: true },
  attendedArchive: {
    events: [{
      eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
      title: { type: String },
      date: { type: Date },
      place: { type: String }
    }],
    trips: [{
      tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
      title: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      place: { type: String }
    }]
  },
  role: { type: String, enum: ['admin','member'], default: 'member' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
