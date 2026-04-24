const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const usersRouter = require('./routes/users');
const eventsRouter = require('./routes/events');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());

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
