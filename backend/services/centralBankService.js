/**
 * Environment-Aware Central Bank Adapter Service
 * 
 * Rules:
 * - In 'test' env: Mock the Central Bank API internally (fixed 5.0% ceiling rate) without external network calls.
 * - In 'intg' and 'uat' envs: Connect directly to the Central Bank Sandbox API endpoint (GET /api/central-bank/ceiling-rate).
 */

class CentralBankService {
  constructor(baseUrl = null) {
    this.baseUrl = baseUrl;
  }

  getBaseUrl() {
    if (this.baseUrl) return this.baseUrl;
    const port = process.env.PORT || 5000;
    return process.env.CENTRAL_BANK_API_URL || `http://localhost:${port}/api/central-bank`;
  }

  async getCeilingRate() {
    const env = (process.env.APP_ENV || 'test').toLowerCase();

    if (env === 'test') {
      // Mock Central Bank API internally without external network calls
      return {
        ceilingRate: 5.0,
        currency: 'USD',
        source: 'MOCK_INTERNAL',
        env: 'test'
      };
    }

    // 'intg' and 'uat' environments connect directly to Central Bank Sandbox API
    try {
      const url = `${this.getBaseUrl()}/ceiling-rate`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Central Bank Sandbox API responded with status ${response.status}`);
      }

      const data = await response.json();
      return {
        ceilingRate: Number(data.ceilingRate) || 5.5,
        currency: data.currency || 'USD',
        source: 'LIVE_SANDBOX',
        env
      };
    } catch (err) {
      console.warn(`[CentralBankService] Failed to query live sandbox API (${err.message}). Falling back to regulatory default.`);
      return {
        ceilingRate: 5.5,
        currency: 'USD',
        source: 'FALLBACK_SANDBOX',
        env
      };
    }
  }

  /**
   * Calculate effective interest rate for an account:
   * - CHECKING: 0.00%
   * - SAVINGS: ceilingRate - margin (margin tier 1% or 2%)
   * @param {string} accountType 'SAVINGS' | 'CHECKING'
   * @param {number|string} marginTier 1 or 2 (percentage points below ceiling)
   * @returns {Promise<number>} calculated effective rate rounded to 2 decimal places
   */
  async calculateInterestRate(accountType, marginTier = 1) {
    const type = (accountType || '').toUpperCase();
    if (type !== 'SAVINGS') {
      return 0.00;
    }

    const { ceilingRate } = await this.getCeilingRate();
    const margin = Number(marginTier) === 2 ? 2.0 : 1.0;
    const calculatedRate = Math.max(0, ceilingRate - margin);
    return Math.round(calculatedRate * 100) / 100;
  }
}

const centralBankService = new CentralBankService();
module.exports = {
  CentralBankService,
  centralBankService
};
