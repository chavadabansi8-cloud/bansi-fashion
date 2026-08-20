const express = require('express');
const router = express.Router();
const Advance = require('../models/Advance');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Add advance / upad entry
router.post('/add', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { workerId, workerName, amount, date, note } = req.body;
    if (!workerId || !amount) {
      return res.status(400).json({ message: 'Worker ID and Amount are required.' });
    }

    const advance = new Advance({
      workerId: String(workerId).trim().toUpperCase(),
      workerName: workerName || workerId,
      amount: Number(amount) || 0,
      date: date || new Date().toISOString().split('T')[0],
      note: note || 'Advance Upad'
    });

    await advance.save();
    res.status(201).json({ message: 'Advance recorded successfully', advance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all advances (admin use)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const advances = await Advance.find().sort({ createdAt: -1 });
    res.json(advances);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get advances for specific worker
router.get('/worker/:workerId', authMiddleware, async (req, res) => {
  try {
    const normalizedId = req.params.workerId.toUpperCase();
    const advances = await Advance.find({ workerId: normalizedId }).sort({ createdAt: -1 });
    res.json(advances);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete advance record
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Advance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Advance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
