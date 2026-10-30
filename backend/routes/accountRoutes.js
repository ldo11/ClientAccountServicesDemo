const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const pool = require('../db');
const authMiddleware = require('../authMiddleware');
const { centralBankService } = require('../services/centralBankService');

const router = express.Router();

router.use(authMiddleware);

function generateAccountNumber(prefix) {
  const randomDigits = crypto.randomInt(100000000000, 999999999999).toString();
  return `${prefix}${randomDigits}`;
}

// GET /api/accounts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT account_id, client_id, account_number, account_type, balance, interest_rate
       FROM accounts
       WHERE client_id = $1
       ORDER BY account_type ASC`,
      [req.user.clientId]
    );

    const accounts = result.rows.map((row) => ({
      accountId: row.account_id,
      clientId: row.client_id,
      accountNumber: row.account_number,
      accountType: row.account_type,
      balance: Number(row.balance).toFixed(2),
      interestRate: Number(row.interest_rate).toFixed(2),
    }));

    return res.status(200).json(accounts);
  } catch (err) {
    console.error('[ACCOUNTS] GET list error:', err);
    return res.status(500).json({ message: 'Internal server error retrieving accounts' });
  }
});

// POST /api/accounts - Create a new Account (Savings with Margin Tier or Checking)
router.post('/', async (req, res) => {
  const { accountType, initialBalance, marginTier } = req.body || {};

  const cleanType = (accountType || '').trim().toUpperCase();
  if (!['SAVINGS', 'CHECKING'].includes(cleanType)) {
    return res.status(400).json({ message: "accountType must be either 'SAVINGS' or 'CHECKING'" });
  }

  const parsedBalance = Number(initialBalance);
  const balance = Number.isFinite(parsedBalance) && parsedBalance >= 0 ? parsedBalance : 0.00;

  let interestRate = 0.00;
  if (cleanType === 'SAVINGS') {
    const selectedMargin = Number(marginTier) === 2 ? 2 : 1;
    interestRate = await centralBankService.calculateInterestRate('SAVINGS', selectedMargin);
  }

  const prefix = cleanType === 'SAVINGS' ? 'SAV' : 'CHK';
  const accountId = uuidv4();
  const accountNumber = generateAccountNumber(prefix);

  try {
    const result = await pool.query(
      `INSERT INTO accounts (account_id, client_id, account_number, account_type, balance, interest_rate)
       VALUES ($1, $2, $3, $4, $5::numeric(15,2), $6::numeric(5,2))
       RETURNING account_id, client_id, account_number, account_type, balance, interest_rate`,
      [accountId, req.user.clientId, accountNumber, cleanType, balance.toFixed(2), interestRate.toFixed(2)]
    );

    const row = result.rows[0];
    return res.status(201).json({
      message: `${cleanType} account created successfully`,
      account: {
        accountId: row.account_id,
        clientId: row.client_id,
        accountNumber: row.account_number,
        accountType: row.account_type,
        balance: Number(row.balance).toFixed(2),
        interestRate: Number(row.interest_rate).toFixed(2)
      }
    });
  } catch (err) {
    console.error('[ACCOUNTS] POST create error:', err);
    return res.status(500).json({ message: 'Internal server error creating account' });
  }
});

// POST /api/accounts/transfer
router.post('/transfer', async (req, res) => {
  const { fromAccountId, toAccountId, amount } = req.body || {};

  if (!fromAccountId || !toAccountId) {
    return res.status(400).json({
      message: 'Both fromAccountId and toAccountId are required',
    });
  }

  if (!uuidValidate(fromAccountId) || !uuidValidate(toAccountId)) {
    return res.status(400).json({
      message: 'Invalid account ID format',
    });
  }

  if (fromAccountId === toAccountId) {
    return res.status(400).json({
      message: 'Source and destination accounts cannot be the same',
    });
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({
      message: 'Transfer amount must be greater than 0',
    });
  }

  const amountCents = Math.round(parsedAmount * 100);
  const formattedAmount = (amountCents / 100).toFixed(2);

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    // Lock both accounts in deterministic order to avoid deadlocks
    const lockedRes = await dbClient.query(
      `SELECT account_id, client_id, account_number, account_type, balance, interest_rate
       FROM accounts
       WHERE account_id IN ($1, $2)
       ORDER BY account_id
       FOR UPDATE`,
      [fromAccountId, toAccountId]
    );

    const fromAccount = lockedRes.rows.find((r) => r.account_id === fromAccountId);
    const toAccount = lockedRes.rows.find((r) => r.account_id === toAccountId);

    if (!fromAccount) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ message: 'Source account not found' });
    }

    if (fromAccount.client_id !== req.user.clientId) {
      await dbClient.query('ROLLBACK');
      return res.status(403).json({ message: 'Forbidden: Source account does not belong to you' });
    }

    if (!toAccount) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ message: 'Destination account not found' });
    }

    const sourceBalanceCents = Math.round(Number(fromAccount.balance) * 100);
    if (sourceBalanceCents < amountCents) {
      await dbClient.query('ROLLBACK');
      return res.status(400).json({
        message: 'Insufficient funds in source account',
      });
    }

    const deductRes = await dbClient.query(
      `UPDATE accounts
       SET balance = balance - $1::numeric(15,2)
       WHERE account_id = $2
       RETURNING balance, interest_rate`,
      [formattedAmount, fromAccountId]
    );

    const creditRes = await dbClient.query(
      `UPDATE accounts
       SET balance = balance + $1::numeric(15,2)
       WHERE account_id = $2
       RETURNING balance, interest_rate`,
      [formattedAmount, toAccountId]
    );

    const transactionId = uuidv4();
    await dbClient.query(
      `INSERT INTO transactions (transaction_id, from_account_id, to_account_id, amount)
       VALUES ($1, $2, $3, $4::numeric(15,2))`,
      [transactionId, fromAccountId, toAccountId, formattedAmount]
    );

    await dbClient.query('COMMIT');

    return res.status(200).json({
      message: 'Transfer successful',
      transactionId,
      newSourceBalance: Number(deductRes.rows[0].balance).toFixed(2),
      newDestinationBalance: Number(creditRes.rows[0].balance).toFixed(2),
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('[ACCOUNTS] Transfer error:', err);
    return res.status(500).json({ message: 'Internal server error processing transfer' });
  } finally {
    dbClient.release();
  }
});

// GET /api/accounts/:accountId
router.get('/:accountId', async (req, res) => {
  const { accountId } = req.params;

  if (!uuidValidate(accountId)) {
    return res.status(400).json({ message: 'Invalid accountId format' });
  }

  try {
    const accountRes = await pool.query(
      `SELECT account_id, client_id, account_number, account_type, balance, interest_rate
       FROM accounts
       WHERE account_id = $1 AND client_id = $2`,
      [accountId, req.user.clientId]
    );

    if (accountRes.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const txRes = await pool.query(
      `SELECT
         t.transaction_id,
         t.from_account_id,
         fa.account_number AS from_account_number,
         fa.account_type AS from_account_type,
         t.to_account_id,
         ta.account_number AS to_account_number,
         ta.account_type AS to_account_type,
         t.amount,
         t.timestamp
       FROM transactions t
       LEFT JOIN accounts fa ON t.from_account_id = fa.account_id
       LEFT JOIN accounts ta ON t.to_account_id = ta.account_id
       WHERE t.from_account_id = $1 OR t.to_account_id = $1
       ORDER BY t.timestamp DESC
       LIMIT 10`,
      [accountId]
    );

    const acc = accountRes.rows[0];
    const transactions = txRes.rows.map((tx) => ({
      transactionId: tx.transaction_id,
      fromAccountId: tx.from_account_id,
      fromAccountNumber: tx.from_account_number,
      fromAccountType: tx.from_account_type,
      toAccountId: tx.to_account_id,
      toAccountNumber: tx.to_account_number,
      toAccountType: tx.to_account_type,
      direction: tx.from_account_id === accountId ? 'DEBIT' : 'CREDIT',
      amount: Number(tx.amount).toFixed(2),
      timestamp: tx.timestamp,
    }));

    return res.status(200).json({
      accountId: acc.account_id,
      clientId: acc.client_id,
      accountNumber: acc.account_number,
      accountType: acc.account_type,
      balance: Number(acc.balance).toFixed(2),
      interestRate: Number(acc.interest_rate).toFixed(2),
      transactions,
    });
  } catch (err) {
    console.error('[ACCOUNTS] GET detail error:', err);
    return res.status(500).json({ message: 'Internal server error retrieving account details' });
  }
});

module.exports = router;
