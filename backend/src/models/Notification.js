const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  // User receiving notification
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // Type of notification
  type: {
    type: String,
    enum: [
      'invitation',
      'event_update',
      'trip_update',
      'rsvp_response',
      'task_assigned',
      'expense_update',
      'message',
      'trip_comment',
      'event_comment',
      'trip_reminder'
    ],
    required: true
  },
  // Title and description
  title: { type: String, required: true },
  message: { type: String, required: true },
  // Related data
  relatedId: { type: Schema.Types.ObjectId }, // Event, Trip, Invitation, etc.
  relatedModel: { type: String }, // Event, Trip, Invitation, etc.
  relatedUser: { type: Schema.Types.ObjectId, ref: 'User' }, // Who triggered the notification
  // Read status
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  // Action URL
  actionUrl: { type: String },
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(+new Date() + 90*24*60*60*1000) } // 90 days
});

module.exports = mongoose.model('Notification', NotificationSchema);
