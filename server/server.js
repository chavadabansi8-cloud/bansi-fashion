const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  'https://bansi-fashion.vercel.app',
  'https://bansi-fashion.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow mobile apps, native apps, curl (where origin is null/undefined)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/work', require('./routes/work'));
app.use('/api/advance', require('./routes/advance'));
app.use('/api/machine', require('./routes/machine'));
app.use('/api/payslip', require('./routes/payslip'));
app.use('/api/inventory', require('./routes/inventory'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', time: new Date() });
});

// MongoDB Connection + Seed default users
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    
    // Seed default admin and test worker if not exist
    const User = require('./models/User');
    
    const adminExists = await User.findOne({ workerId: 'BANSIFASION' });
    if (!adminExists) {
      await User.create({
        name: 'Bansi Fasion',
        workerId: 'BANSIFASION',
        password: 'bansifasion@8471',
        role: 'admin'
      });
      console.log('✅ Default admin created: BANSIFASION / bansifasion@8471');
    }

    // Clean up Test Worker if present in database
    await User.deleteMany({ $or: [{ workerId: 'WORKER001' }, { name: 'Test Worker' }] });
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
