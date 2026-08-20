const mongoose = require('mongoose');

const DesignSchema = new mongoose.Schema({
  designNumber: { type: String, required: true, unique: true },
  category: { type: String, default: 'Saree' }, // Saree, Suit, Lehenga, Blouse, Dress
  totalStitches: { type: Number, default: 25000 },
  ratePerThousand: { type: Number, default: 0.35 }, // e.g. ₹0.35 per 1000 stitches
  threadColors: [{ type: String }],
  description: { type: String, default: '' },
  sampleImageUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const InventorySchema = new mongoose.Schema({
  materialName: { type: String, required: true },
  category: { type: String, default: 'Thread Cones' }, // Thread Cones, Needles, Bobbin, Spare Parts
  quantity: { type: Number, default: 10 },
  unit: { type: String, default: 'Cones' }, // Cones, Boxes, Pieces
  minimumThreshold: { type: Number, default: 5 },
  status: { type: String, enum: ['in_stock', 'low_stock', 'out_of_stock'], default: 'in_stock' },
  lastUpdated: { type: Date, default: Date.now }
});

const NoticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
  postedBy: { type: String, default: 'Bansi Fashion Admin' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Design: mongoose.model('Design', DesignSchema),
  Inventory: mongoose.model('Inventory', InventorySchema),
  Notice: mongoose.model('Notice', NoticeSchema)
};
