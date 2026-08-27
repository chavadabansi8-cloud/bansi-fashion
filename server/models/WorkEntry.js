const mongoose = require('mongoose');

const workEntrySchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workerName: {
    type: String,
    required: true
  },
  workerId: {
    type: String,
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  startTime: {
    type: String,
    default: ''
  },
  endTime: {
    type: String,
    default: ''
  },
  hoursWorked: {
    type: Number,
    default: 0
  },
  shift: {
    type: String,
    enum: ['day', 'night'],
    default: 'day'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  machineNumber: {
    type: String,
    default: ''
  },
  designNumber: {
    type: String,
    default: ''
  },
  designStitch: {
    type: Number,
    default: 0
  },
  frame: {
    type: Number,
    default: 1
  },
  machineStitch: {
    type: Number,
    default: 0
  },
  workerCount: {
    type: Number,
    default: 1
  },
  calculatedTotal: {
    type: Number,
    default: 0
  },
  isExtraWork: {
    type: Boolean,
    default: false
  },
  extraPay: {
    type: Number,
    default: 0
  },
  proofImage: {
    type: String,
    default: ''
  },
  proofImage2: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

workEntrySchema.index({ date: 1, createdAt: -1 });
workEntrySchema.index({ worker: 1, date: 1 });
workEntrySchema.index({ workerId: 1, date: 1 });
workEntrySchema.index({ createdAt: -1 });

module.exports = mongoose.model('WorkEntry', workEntrySchema);
