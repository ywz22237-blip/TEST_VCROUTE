const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const investorRoutes = require('./routes/investor.routes');
const startupRoutes = require('./routes/startup.routes');
const fundRoutes = require('./routes/fund.routes');
const bookmarkRoutes = require('./routes/bookmark.routes');
const adminRoutes = require('./routes/admin.routes');
const noticeRoutes = require('./routes/notice.routes');
const uploadRoutes = require('./routes/upload.routes');

// Import middlewares
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VC Route API is running' });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;
