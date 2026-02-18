const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvitationSchema = new Schema({
  // Who is sending the invitation
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // Who is being invited
  invitedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // What event or trip is being invited to
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
  // Role of the invited person
  role: { 
    type: String, 
    enum: ['organizer', 'participant'], 
    default: 'participant' 
  },
  // Status of invitation
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined', 'cancelled'], 
    default: 'pending' 
  },
  // Message from inviter
  message: { type: String },
  // Decline reason (only for declined invitations)
  declineReason: { 
    predefinedReason: { 
      type: String,
      enum: ['Schedule Conflict', 'Not Interested', 'Already Committed', 'Too Far', 'Budget Constraints', 'Other']
    },
    customReason: { type: String }
  },
  // When invitation was responded to
  respondedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(+new Date() + 30*24*60*60*1000) } // 30 days
});

module.exports = mongoose.model('Invitation', InvitationSchema);
