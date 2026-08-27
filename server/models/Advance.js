const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema({
  workerId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  workerName: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: String, // Format YYYY-MM-DD
    required: true
  },
  note: {
    type: String,
    trim: true,
    default: 'Advance Upad'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

advanceSchema.index({ workerId: 1, createdAt: -1 });
advanceSchema.index({ date: 1 });

module.exports = mongoose.model('Advance', advanceSchema);
