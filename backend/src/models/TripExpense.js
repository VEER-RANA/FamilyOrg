const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TripExpenseSchema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['accommodation', 'transport', 'food', 'activities', 'other'],
    default: 'other'
  },
  paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
  splitAmong: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TripExpense', TripExpenseSchema);
