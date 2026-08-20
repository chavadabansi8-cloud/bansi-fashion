const express = require('express');
const router = express.Router();
const Payslip = require('../models/Payslip');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Save or update salary bill payslip (Admin use)
router.post('/save', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      workerId,
      workerName,
      phone,
      period,
      filterMode,
      baseSalary,
      bonusPay,
      overtimePay,
      grossSalary,
      upadDeduction,
      netSalary,
      entriesCount,
      totalStitches
    } = req.body;

    if (!workerId || !period) {
      return res.status(400).json({ message: 'Worker ID and Period are required.' });
    }

    let payslip = await Payslip.findOne({ workerId, period });

    if (payslip) {
      payslip.workerName = workerName || payslip.workerName;
      payslip.phone = phone || payslip.phone;
      payslip.filterMode = filterMode || payslip.filterMode;
      payslip.baseSalary = Number(baseSalary) || 0;
      payslip.bonusPay = Number(bonusPay) || 0;
      payslip.overtimePay = Number(overtimePay) || 0;
      payslip.grossSalary = Number(grossSalary) || 0;
      payslip.upadDeduction = Number(upadDeduction) || 0;
      payslip.netSalary = Number(netSalary) || 0;
      payslip.entriesCount = Number(entriesCount) || 0;
      payslip.totalStitches = Number(totalStitches) || 0;
      payslip.generatedAt = new Date();
      await payslip.save();
      return res.json({ message: 'Salary Bill updated in DB', payslip });
    }

    payslip = new Payslip({
      workerId,
      workerName,
      phone: phone || '',
      period,
      filterMode: filterMode || 'month',
      baseSalary: Number(baseSalary) || 0,
      bonusPay: Number(bonusPay) || 0,
      overtimePay: Number(overtimePay) || 0,
      grossSalary: Number(grossSalary) || 0,
      upadDeduction: Number(upadDeduction) || 0,
      netSalary: Number(netSalary) || 0,
      entriesCount: Number(entriesCount) || 0,
      totalStitches: Number(totalStitches) || 0
    });

    await payslip.save();
    res.status(201).json({ message: 'Salary Bill saved in DB', payslip });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all saved salary bills (Admin all-time history)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const payslips = await Payslip.find().sort({ generatedAt: -1 });
    res.json(payslips);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get saved salary bills for specific worker
router.get('/worker/:workerId', authMiddleware, async (req, res) => {
  try {
    const payslips = await Payslip.find({ workerId: req.params.workerId }).sort({ generatedAt: -1 });
    res.json(payslips);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a payslip record
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Payslip.findByIdAndDelete(req.params.id);
    res.json({ message: 'Salary Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
