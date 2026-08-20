const express = require('express');
const router = express.Router();
const WorkEntry = require('../models/WorkEntry');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Add work entry (Worker)
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const {
      date,
      startTime,
      endTime,
      hoursWorked,
      shift,
      description,
      machineNumber,
      designNumber,
      designStitch,
      frame,
      machineStitch,
      workerCount,
      calculatedTotal,
      isExtraWork,
      extraPay
    } = req.body;

    const entry = new WorkEntry({
      worker: req.user._id,
      workerName: req.user.name,
      workerId: req.user.workerId,
      date,
      startTime,
      endTime,
      hoursWorked,
      shift: shift === 'night' ? 'night' : 'day',
      description: description || '',
      machineNumber: machineNumber || '',
      designNumber: designNumber || '',
      designStitch: Number(designStitch) || 0,
      frame: Number(frame) || 1,
      machineStitch: Number(machineStitch) || 0,
      workerCount: Number(workerCount) || 1,
      calculatedTotal: Number(calculatedTotal) || 0,
      isExtraWork: isExtraWork || false,
      extraPay: extraPay || 0
    });

    await entry.save();
    res.status(201).json({ message: 'Work entry added successfully', entry });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get today's entries for logged-in worker
router.get('/my/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const entries = await WorkEntry.find({
      worker: req.user._id,
      date: today
    }).sort({ createdAt: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all entries for logged-in worker (history)
router.get('/my/history', authMiddleware, async (req, res) => {
  try {
    const entries = await WorkEntry.find({ worker: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ADMIN: Get ALL workers' today's entries
router.get('/admin/today', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const entries = await WorkEntry.find({ date: today }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ADMIN: Get ALL entries by date
router.get('/admin/date/:date', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const entries = await WorkEntry.find({ date: req.params.date }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ADMIN: Get ALL entries (all time / long-term history)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = {};
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    const entries = await WorkEntry.find(query).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ADMIN: Update entry status (approve/reject)
router.put('/admin/status/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const entry = await WorkEntry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ message: 'Status updated', entry });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
