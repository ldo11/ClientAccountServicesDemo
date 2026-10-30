const express = require('express');
const { validate: uuidValidate } = require('uuid');
const pool = require('../db');
const authMiddleware = require('../authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// GET /api/clients/:clientId
router.get('/:clientId', async (req, res) => {
  const { clientId } = req.params;

  if (!uuidValidate(clientId)) {
    return res.status(400).json({ message: 'Invalid clientId format' });
  }

  if (req.user.clientId !== clientId) {
    return res.status(403).json({ message: 'Forbidden: Cannot access another client profile' });
  }

  try {
    const result = await pool.query(
      `SELECT client_id, username, mobile, address, created_at
       FROM clients
       WHERE client_id = $1`,
      [clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const row = result.rows[0];
    return res.status(200).json({
      clientId: row.client_id,
      username: row.username,
      mobile: row.mobile,
      address: row.address,
      createdAt: row.created_at,
    });
  } catch (err) {
    console.error('[CLIENTS] GET error:', err);
    return res.status(500).json({ message: 'Internal server error fetching client profile' });
  }
});

// PUT /api/clients/:clientId
router.put('/:clientId', async (req, res) => {
  const { clientId } = req.params;
  const { mobile, address } = req.body || {};

  if (!uuidValidate(clientId)) {
    return res.status(400).json({ message: 'Invalid clientId format' });
  }

  if (req.user.clientId !== clientId) {
    return res.status(403).json({ message: 'Forbidden: Cannot update another client profile' });
  }

  if (
    !mobile ||
    typeof mobile !== 'string' ||
    !mobile.trim() ||
    !address ||
    typeof address !== 'string' ||
    !address.trim()
  ) {
    return res.status(400).json({ message: 'Both mobile and address are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE clients
       SET mobile = $1, address = $2
       WHERE client_id = $3
       RETURNING client_id, username, mobile, address, created_at`,
      [mobile.trim(), address.trim(), clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const row = result.rows[0];
    const clientPayload = {
      clientId: row.client_id,
      username: row.username,
      mobile: row.mobile,
      address: row.address,
      createdAt: row.created_at,
    };

    return res.status(200).json({
      message: 'Profile updated successfully',
      ...clientPayload,
      client: clientPayload,
    });
  } catch (err) {
    console.error('[CLIENTS] PUT error:', err);
    return res.status(500).json({ message: 'Internal server error updating client profile' });
  }
});

// DELETE /api/clients/:clientId
router.delete('/:clientId', async (req, res) => {
  const { clientId } = req.params;

  if (!uuidValidate(clientId)) {
    return res.status(400).json({ message: 'Invalid clientId format' });
  }

  if (req.user.clientId !== clientId) {
    return res.status(403).json({ message: 'Forbidden: Cannot delete another client profile' });
  }

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    await dbClient.query(
      `DELETE FROM transactions
       WHERE from_account_id IN (SELECT account_id FROM accounts WHERE client_id = $1)
          OR to_account_id IN (SELECT account_id FROM accounts WHERE client_id = $1)`,
      [clientId]
    );

    const result = await dbClient.query(
      'DELETE FROM clients WHERE client_id = $1 RETURNING client_id',
      [clientId]
    );

    if (result.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ message: 'Client not found' });
    }

    await dbClient.query('COMMIT');
    return res.status(200).json({
      message: 'Client and associated accounts deleted successfully',
      clientId,
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('[CLIENTS] DELETE error:', err);
    return res.status(500).json({ message: 'Internal server error deleting client' });
  } finally {
    dbClient.release();
  }
});

module.exports = router;
