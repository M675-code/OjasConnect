const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const usersRouter = require('./routes/users');
const eventsRouter = require('./routes/events');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Allow cross-origin resource loading for uploaded images (needed when frontend runs on a different origin)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Serve uploaded images and allow cross-origin access to them
app.use('/uploads', (req, res, next) => {
  // permit any origin for uploaded assets (these are public resources)
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '..', 'public', 'uploads')));

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
if (process.env.NODE_ENV === 'production') {
  app.use(cors({ origin: allowedOrigin }));
} else {
  app.use(cors());
}

app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// API routes
app.use('/api', usersRouter);
app.use('/api', eventsRouter);

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Error handler
app.use(errorHandler);

module.exports = app;
