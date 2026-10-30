const express = require('express');
const router = express.Router();

/**
 * Central Bank Sandbox API Service
 * GET /api/central-bank/ceiling-rate
 * Returns current regulatory ceiling interest rate
 */
router.get('/ceiling-rate', (req, res) => {
  return res.status(200).json({
    ceilingRate: 5.5,
    currency: 'USD',
    effectiveDate: new Date().toISOString().split('T')[0],
    regulatoryBody: 'Federal Central Reserve Banking Authority'
  });
});

module.exports = router;
