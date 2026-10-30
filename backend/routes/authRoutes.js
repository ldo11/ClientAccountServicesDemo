const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { centralBankService } = require('../services/centralBankService');

const router = express.Router();

function generateAccountNumber(prefix) {
  const randomDigits = crypto.randomInt(100000000000, 999999999999).toString();
  return `${prefix}${randomDigits}`;
}

function parseInitialBalance(value, defaultValue = 1000.0) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const {
    username,
    password,
    mobile,
    address,
    initialCheckingBalance,
    initialSavingsBalance,
    savingsMarginTier
  } = req.body || {};

  if (
    !username ||
    typeof username !== 'string' ||
    !username.trim() ||
    !password ||
    typeof password !== 'string' ||
    !mobile ||
    typeof mobile !== 'string' ||
    !mobile.trim() ||
    !address ||
    typeof address !== 'string' ||
    !address.trim()
  ) {
    return res.status(400).json({
      message: 'All fields (username, password, mobile, address) are required',
    });
  }

  const checkingBalance = parseInitialBalance(initialCheckingBalance, 1000.0);
  const savingsBalance = parseInitialBalance(initialSavingsBalance, 1000.0);

  if (checkingBalance === null || savingsBalance === null) {
    return res.status(400).json({
      message: 'Initial balances must be valid non-negative numbers',
    });
  }

  const cleanUsername = username.trim();
  const cleanMobile = mobile.trim();
  const cleanAddress = address.trim();

  // Determine interest rates
  // Checking is always 0.00%
  const checkingInterestRate = 0.00;
  // Savings rate is calculated based on Central Bank ceiling - margin tier
  const marginTier = Number(savingsMarginTier) === 2 ? 2 : 1;
  const savingsInterestRate = await centralBankService.calculateInterestRate('SAVINGS', marginTier);

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const existing = await dbClient.query(
      'SELECT client_id FROM clients WHERE username = $1',
      [cleanUsername]
    );
    if (existing.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return res.status(409).json({ message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const clientId = uuidv4();

    await dbClient.query(
      `INSERT INTO clients (client_id, username, password_hash, mobile, address)
       VALUES ($1, $2, $3, $4, $5)`,
      [clientId, cleanUsername, passwordHash, cleanMobile, cleanAddress]
    );

    const checkingAccountId = uuidv4();
    const checkingAccountNumber = generateAccountNumber('CHK');
    const checkingRes = await dbClient.query(
      `INSERT INTO accounts (account_id, client_id, account_number, account_type, balance, interest_rate)
       VALUES ($1, $2, $3, 'CHECKING', $4::numeric(15,2), $5::numeric(5,2))
       RETURNING account_id, client_id, account_number, account_type, balance, interest_rate`,
      [checkingAccountId, clientId, checkingAccountNumber, checkingBalance.toFixed(2), checkingInterestRate.toFixed(2)]
    );

    const savingsAccountId = uuidv4();
    const savingsAccountNumber = generateAccountNumber('SAV');
    const savingsRes = await dbClient.query(
      `INSERT INTO accounts (account_id, client_id, account_number, account_type, balance, interest_rate)
       VALUES ($1, $2, $3, 'SAVINGS', $4::numeric(15,2), $5::numeric(5,2))
       RETURNING account_id, client_id, account_number, account_type, balance, interest_rate`,
      [savingsAccountId, clientId, savingsAccountNumber, savingsBalance.toFixed(2), savingsInterestRate.toFixed(2)]
    );

    await dbClient.query('COMMIT');

    const accounts = [checkingRes.rows[0], savingsRes.rows[0]].map((row) => ({
      accountId: row.account_id,
      clientId: row.client_id,
      accountNumber: row.account_number,
      accountType: row.account_type,
      balance: Number(row.balance).toFixed(2),
      interestRate: Number(row.interest_rate).toFixed(2)
    }));

    return res.status(201).json({
      message: 'Client registered successfully',
      clientId,
      username: cleanUsername,
      accounts,
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    console.error('[AUTH] Register error:', err);
    return res.status(500).json({ message: 'Internal server error during registration' });
  } finally {
    dbClient.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const result = await pool.query(
      `SELECT client_id, username, password_hash, mobile, address
       FROM clients
       WHERE username = $1`,
      [String(username).trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const clientRow = result.rows[0];
    const isMatch = await bcrypt.compare(String(password), clientRow.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { clientId: clientRow.client_id, username: clientRow.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      client: {
        clientId: clientRow.client_id,
        username: clientRow.username,
        mobile: clientRow.mobile,
        address: clientRow.address,
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return res.status(500).json({ message: 'Internal server error during login' });
  }
});

module.exports = router;
