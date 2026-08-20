const mongoose = require('mongoose');

const machineLogSchema = new mongoose.Schema({
  type: { type: String, required: true },
  date: { type: String, required: true },
  note: { type: String, default: '' }
});

const machineSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'repair'],
    default: 'active'
  },
  speed: {
    type: Number,
    default: 850
  },
  operator: {
    type: String,
    default: 'Unassigned'
  },
  lastOiling: {
    type: String,
    default: 'Today 08:00 AM'
  },
  maintenanceNote: {
    type: String,
    default: 'Operational'
  },
  logs: [machineLogSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Machine', machineSchema);
