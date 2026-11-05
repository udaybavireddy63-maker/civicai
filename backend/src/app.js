const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const { getConnectionStatus } = require('./config/db');

// Routes & Middleware
const authRoutes = require('./routes/authRoutes');
const authenticate = require('./middleware/auth');
const { requireAdmin } = require('./middleware/role');

const app = express();

// HTTP request logging (excluding secrets and sensitive authorization headers)
morgan.token('clean-url', (req) => req.originalUrl.split('?')[0]);
app.use(morgan('[:date[iso]] :method :clean-url :status :response-time ms - :res[content-length]'));

// Credentialed CORS Configuration
const allowedOrigins = [
  config.clientOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin === config.clientOrigin) {
        return callback(null, true);
      }
      if (config.nodeEnv !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback for local client development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Database Health check endpoints
app.get('/health', (req, res) => {
  const dbStatus = getConnectionStatus();
  const isHealthy = dbStatus.isHealthy;

  const responsePayload = {
    success: isHealthy,
    data: {
      status: isHealthy ? 'UP' : 'DEGRADED',
      service: 'CivicAI Backend',
      database: dbStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    },
    message: isHealthy ? 'CivicAI services and MongoDB are fully operational' : 'Database connection unavailable'
  };

  res.status(isHealthy ? 200 : 503).json(responsePayload);
});

app.get('/api/v1/health', (req, res) => {
  const dbStatus = getConnectionStatus();
  const isHealthy = dbStatus.isHealthy;

  const responsePayload = {
    success: isHealthy,
    data: {
      status: isHealthy ? 'UP' : 'DEGRADED',
      service: 'CivicAI API v1',
      database: dbStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    },
    message: isHealthy ? 'CivicAI API v1 & MongoDB are operational' : 'Database connection unavailable'
  };

  res.status(isHealthy ? 200 : 503).json(responsePayload);
});

// Mount Authentication Routes
app.use('/api/v1/auth', authRoutes);

// Mount Complaints Workflow Routes
const complaintRoutes = require('./routes/complaintRoutes');
const path = require('path');
app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')));
app.use('/api/v1/complaints', complaintRoutes);

// Protected Admin Verification Endpoint (used to test & verify role authorization)
app.get('/api/v1/admin/verify', authenticate, requireAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Admin authorization verified.',
      user: req.user.toJSON()
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[CivicAI Error]', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred'
    }
  });
});

module.exports = app;
