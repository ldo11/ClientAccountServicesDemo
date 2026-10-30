const pool = require('./db');

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        client_id UUID PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        account_id UUID PRIMARY KEY,
        client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
        account_number VARCHAR(20) UNIQUE NOT NULL,
        account_type VARCHAR(15) NOT NULL CHECK (account_type IN ('SAVINGS', 'CHECKING')),
        balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
        interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00
      );
    `);

    // Ensure interest_rate column exists if table was created in an earlier phase
    await client.query(`
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id UUID PRIMARY KEY,
        from_account_id UUID REFERENCES accounts(account_id) ON DELETE CASCADE,
        to_account_id UUID REFERENCES accounts(account_id) ON DELETE CASCADE,
        amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_accounts_client_id ON accounts(client_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
    `);

    await client.query('COMMIT');
    console.log('[DB] Neon PostgreSQL schema verified/initialized successfully (with interest_rate column).');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB] Schema initialization failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = initDatabase;
