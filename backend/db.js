require('dotenv').config({ quiet: true });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('[DB] CRITICAL: DATABASE_URL is not defined in environment variables.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle PostgreSQL client:', err.message);
});

module.exports = pool;
