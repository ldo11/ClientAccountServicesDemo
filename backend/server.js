require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const pool = require('./db');
const initDatabase = require('./dbInit');
const swaggerDocument = require('./swagger');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const accountRoutes = require('./routes/accountRoutes');
const centralBankRoutes = require('./routes/centralBankRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// Swagger OpenAPI Documentation Endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Swagger JSON Spec Endpoint
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'UP',
      db: 'CONNECTED',
      env: (process.env.APP_ENV || 'test').toLowerCase()
    });
  } catch (err) {
    console.error('[HEALTH] Database connectivity check failed:', err.message);
    return res.status(503).json({ status: 'DOWN', db: 'DISCONNECTED' });
  }
});

// Mount API Routers
app.use('/api/central-bank', centralBankRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/accounts', accountRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('[SERVER] Unhandled error:', err);
  res.status(500).json({ message: 'Unexpected internal server error' });
});

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`[SERVER] FinTech Core API running on http://localhost:${PORT}`);
      console.log(`[SERVER] Health endpoint: http://localhost:${PORT}/api/health`);
      console.log(`[SERVER] Swagger Docs: http://localhost:${PORT}/api-docs`);
      console.log(`[SERVER] Environment: ${process.env.APP_ENV || 'test'}`);
    });
  } catch (err) {
    console.error('[SERVER] Failed to start server due to database initialization error:', err);
    process.exit(1);
  }
}

// Start only if not imported as module (e.g. for testing)
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
