const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
  workerId: { type: String, required: true, index: true },
  workerName: { type: String, required: true },
  phone: { type: String, default: '' },
  period: { type: String, required: true }, // e.g. '2026-08' or '2026-08-18'
  filterMode: { type: String, default: 'month' },
  baseSalary: { type: Number, default: 0 },
  bonusPay: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  upadDeduction: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  entriesCount: { type: Number, default: 0 },
  totalStitches: { type: Number, default: 0 },
  generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payslip', payslipSchema);
