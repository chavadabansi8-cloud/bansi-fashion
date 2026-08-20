const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Register new user (worker or admin)
router.post('/register', async (req, res) => {
  try {
    const { name, workerId, password, role, salary, bonus, phone, aadhaarNumber, machineNumber } = req.body;
    const normalizedWorkerId = String(workerId || '').trim().toUpperCase();

    const existingUser = await User.findOne({ workerId: normalizedWorkerId });
    if (existingUser) {
      return res.status(400).json({ message: 'Worker ID already exists.' });
    }

    const user = new User({
      name,
      workerId: normalizedWorkerId,
      phone: phone || '',
      aadhaarNumber: aadhaarNumber || '',
      machineNumber: machineNumber || '',
      password,
      plainPassword: password || '',
      role: role || 'worker',
      salary: Number(salary) || 0,
      bonus: Number(bonus) || 0
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        workerId: user.workerId,
        phone: user.phone,
        aadhaarNumber: user.aadhaarNumber,
        plainPassword: user.plainPassword,
        role: user.role,
        salary: user.salary
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { workerId, password } = req.body;
    const normalizedWorkerId = String(workerId || '').trim().toUpperCase();

    const user = await User.findOne({ workerId: normalizedWorkerId });
    if (!user) {
      return res.status(400).json({ message: 'Worker ID not found.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password.' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        workerId: user.workerId,
        phone: user.phone,
        aadhaarNumber: user.aadhaarNumber,
        plainPassword: user.plainPassword,
        role: user.role,
        salary: user.salary
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update worker details (admin use)
router.post('/workers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, workerId, phone, aadhaarNumber, machineNumber, salary, bonus, password } = req.body;
    const normalizedWorkerId = String(workerId || '').trim().toUpperCase();
    const normalizedPhone = phone !== undefined ? String(phone || '').trim() : '';

    if (!normalizedWorkerId) {
      return res.status(400).json({ message: 'Worker ID is required.' });
    }

    if (phone !== undefined && phone !== '' && !/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    let user = await User.findOne({ workerId: normalizedWorkerId });

    if (user) {
      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone || '';
      if (aadhaarNumber !== undefined) user.aadhaarNumber = aadhaarNumber || '';
      if (machineNumber !== undefined) user.machineNumber = machineNumber || '';
      if (salary !== undefined) user.salary = Number(salary) || 0;
      if (bonus !== undefined) user.bonus = Number(bonus) || 0;
      if (password) {
        user.password = password;
        user.plainPassword = password;
      }

      await user.save();

      return res.json({
        message: 'Worker updated successfully',
        user: {
          id: user._id,
          name: user.name,
          workerId: user.workerId,
          phone: user.phone,
          aadhaarNumber: user.aadhaarNumber,
          plainPassword: user.plainPassword,
          machineNumber: user.machineNumber,
          role: user.role,
          salary: user.salary,
          bonus: user.bonus
        }
      });
    }

    if (!password) {
      return res.status(400).json({ message: 'Worker not found. Please use an existing worker ID.' });
    }

    user = new User({
      name: name || 'Worker',
      workerId: normalizedWorkerId,
      phone: normalizedPhone,
      aadhaarNumber: aadhaarNumber || '',
      password,
      plainPassword: password || '',
      role: 'worker',
      salary: Number(salary) || 0,
      bonus: Number(bonus) || 0
    });

    await user.save();

    res.status(201).json({
      message: 'Worker added successfully',
      user: {
        id: user._id,
        name: user.name,
        workerId: user.workerId,
        phone: user.phone,
        aadhaarNumber: user.aadhaarNumber,
        plainPassword: user.plainPassword,
        role: user.role,
        salary: user.salary,
        bonus: user.bonus
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all workers (admin use)
router.get('/workers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
