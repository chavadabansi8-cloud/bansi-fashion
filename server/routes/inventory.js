const express = require('express');
const router = express.Router();
const { Design, Inventory, Notice } = require('../models/NoticeAndInventory');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ===== DESIGN CATALOG ROUTES =====
router.get('/designs', authMiddleware, async (req, res) => {
  try {
    let designs = await Design.find().sort({ createdAt: -1 });
    if (designs.length === 0) {
      // Seed default embroidery designs if empty
      designs = await Design.insertMany([
        { designNumber: 'D-801', category: 'Saree Border', totalStitches: 45000, ratePerThousand: 0.38, threadColors: ['Golden Jari', 'Royal Blue', 'Resham Red'], description: 'Bridal Heavy Border Embroidery' },
        { designNumber: 'D-802', category: 'Lehenga Motif', totalStitches: 68000, ratePerThousand: 0.42, threadColors: ['Silver Jari', 'Emerald Green', 'Pink'], description: 'All-over Chaniya Choli Embroidery' },
        { designNumber: 'D-803', category: 'Suit Neckline', totalStitches: 28000, ratePerThousand: 0.35, threadColors: ['Golden Jari', 'Maroon'], description: 'Designer Kurti Neck Pattern' }
      ]);
    }
    res.json(designs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/designs/save', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { designNumber, category, totalStitches, ratePerThousand, threadColors, description } = req.body;
    let design = await Design.findOne({ designNumber });
    if (design) {
      design.category = category || design.category;
      design.totalStitches = totalStitches || design.totalStitches;
      design.ratePerThousand = ratePerThousand || design.ratePerThousand;
      design.threadColors = threadColors || design.threadColors;
      design.description = description || design.description;
      await design.save();
    } else {
      design = await Design.create({ designNumber, category, totalStitches, ratePerThousand, threadColors, description });
    }
    res.json(design);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/designs/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Design.findByIdAndDelete(req.params.id);
    res.json({ message: 'Design removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== INVENTORY STOCK ROUTES =====
router.get('/stock', authMiddleware, async (req, res) => {
  try {
    let items = await Inventory.find().sort({ materialName: 1 });
    if (items.length === 0) {
      // Seed default raw material inventory
      items = await Inventory.insertMany([
        { materialName: '120D Golden Jari Thread Cones', category: 'Jari Thread', quantity: 35, unit: 'Cones', minimumThreshold: 10, status: 'in_stock' },
        { materialName: 'Polyester Resham Thread (Royal Blue)', category: 'Resham Thread', quantity: 4, unit: 'Cones', minimumThreshold: 8, status: 'low_stock' },
        { materialName: 'Embroidery Machine Needles DBxK5 (Size 11)', category: 'Needles & Spares', quantity: 15, unit: 'Boxes', minimumThreshold: 5, status: 'in_stock' },
        { materialName: 'Aluminum Bobbin Cases', category: 'Spare Parts', quantity: 2, unit: 'Pieces', minimumThreshold: 5, status: 'low_stock' },
        { materialName: 'Pre-wound White Bobbin Thread', category: 'Bobbin Thread', quantity: 40, unit: 'Boxes', minimumThreshold: 12, status: 'in_stock' }
      ]);
    }
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stock/update', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id, materialName, category, quantity, unit, minimumThreshold } = req.body;
    let item;
    if (id) {
      item = await Inventory.findById(id);
    }
    if (!item && materialName) {
      item = await Inventory.findOne({ materialName });
    }

    const qty = Number(quantity);
    const minT = Number(minimumThreshold) || 5;
    const status = qty <= 0 ? 'out_of_stock' : qty <= minT ? 'low_stock' : 'in_stock';

    if (item) {
      item.quantity = qty;
      item.category = category || item.category;
      item.unit = unit || item.unit;
      item.minimumThreshold = minT;
      item.status = status;
      item.lastUpdated = new Date();
      await item.save();
    } else {
      item = await Inventory.create({ materialName, category, quantity: qty, unit: unit || 'Cones', minimumThreshold: minT, status });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== FACTORY NOTICES & ANNOUNCEMENTS ROUTES =====
router.get('/notices', authMiddleware, async (req, res) => {
  try {
    let notices = await Notice.find().sort({ createdAt: -1 });
    if (notices.length === 0) {
      notices = await Notice.insertMany([
        { title: '📢 Shift Timing & Attendance Notice', message: 'Day Shift starts strictly at 08:00 AM. Night Shift starts at 08:00 PM. Please record machine stitch entries daily.', priority: 'important' },
        { title: '⚡ Machine Maintenance Schedule', message: 'Machine 1 & Machine 2 oiling must be logged twice daily. Contact Lakha / Admin for needle changes.', priority: 'normal' }
      ]);
    }
    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notices/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, message, priority } = req.body;
    const notice = await Notice.create({ title, message, priority: priority || 'normal' });
    res.json(notice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notices/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
