const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  workerId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    set: value => value ? value.trim().toUpperCase() : value
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  aadhaarNumber: {
    type: String,
    trim: true,
    default: ''
  },
  machineNumber: {
    type: String,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  plainPassword: {
    type: String,
    default: ''
  },
  patternLock: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['worker', 'admin'],
    default: 'worker'
  },
  salary: {
    type: Number,
    default: 0
  },  bonus: {
    type: Number,
    default: 0
  },  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
