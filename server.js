require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const birthChartRoutes = require('./routes/birthChart');
const horoscopeRoutes = require('./routes/horoscope');
const compatibilityRoutes = require('./routes/compatibility');
const affirmationRoutes = require('./routes/affirmations');
const spiritualRoutes = require('./routes/spiritual');
const communityRoutes = require('./routes/community');
const aiAstroRoutes = require('./routes/aiAstro');
const cosmicRoutes = require('./routes/cosmic');
const journalRoutes = require('./routes/journal');
const pagesRoutes = require('./routes/pages');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lumin-guide';
mongoose.connect(MONGODB_URI).then(() => {
  const dbName = mongoose.connection.db?.databaseName || 'lumin';
  console.log('MongoDB connected to database:', dbName);
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', birthChartRoutes);
app.use('/api/horoscope', horoscopeRoutes);
app.use('/api/compatibility', compatibilityRoutes);
app.use('/api/affirmations', affirmationRoutes);
app.use('/api/spiritual', spiritualRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/ai-astro', aiAstroRoutes);
app.use('/api/cosmic', cosmicRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState; // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const isDbConnected = dbState === 1;
  const status = isDbConnected ? 200 : 503;
  res.status(status).json({
    ok: isDbConnected,
    uptime: Math.floor(process.uptime()),
    db: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
