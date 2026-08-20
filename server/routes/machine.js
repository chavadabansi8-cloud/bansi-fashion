const express = require('express');
const router = express.Router();
const Machine = require('../models/Machine');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Seed default machines if empty
const seedMachinesIfEmpty = async () => {
  const count = await Machine.countDocuments();
  if (count === 0) {
    await Machine.create([
      {
        machineId: '1',
        name: 'Machine 1 (Suba 12-Head)',
        status: 'active',
        speed: 850,
        operator: 'LAKHA',
        lastOiling: 'Today 08:00 AM',
        maintenanceNote: 'Operational',
        logs: [
          { type: 'Oiling Routine', date: 'Today 08:00 AM', note: 'Standard morning lubrication' }
        ]
      },
      {
        machineId: '2',
        name: 'Machine 2 (Suba 15-Head)',
        status: 'active',
        speed: 900,
        operator: 'WORKER001',
        lastOiling: 'Today 09:30 AM',
        maintenanceNote: 'Operational',
        logs: [
          { type: 'Needle Replace', date: 'Yesterday 04:15 PM', note: 'Head 3 needle replaced' }
        ]
      }
    ]);
  }
};

// Get all machines
router.get('/all', authMiddleware, async (req, res) => {
  try {
    await seedMachinesIfEmpty();
    const machines = await Machine.find().sort({ machineId: 1 });
    res.json(machines);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update machine status
router.put('/status/:machineId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, operator, speed } = req.body;
    const update = { updatedAt: Date.now() };
    if (status) update.status = status;
    if (operator) update.operator = operator;
    if (speed) update.speed = Number(speed);

    const machine = await Machine.findOneAndUpdate(
      { machineId: req.params.machineId },
      update,
      { new: true, upsert: true }
    );
    res.json({ message: 'Machine status updated', machine });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add maintenance log to machine
router.post('/log/:machineId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type, note } = req.body;
    const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const machine = await Machine.findOne({ machineId: req.params.machineId });
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    machine.logs.unshift({
      type: type || 'Maintenance Log',
      date: dateStr,
      note: note || 'Routine Log'
    });

    if (type.toLowerCase().includes('oiling')) {
      machine.lastOiling = `Today ${dateStr}`;
    }

    await machine.save();
    res.json({ message: 'Log added', machine });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
