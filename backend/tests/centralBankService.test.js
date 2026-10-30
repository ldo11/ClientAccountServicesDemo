const { CentralBankService } = require('../services/centralBankService');

describe('CentralBankService - Interest Rate Calculation Logic', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.APP_ENV;
  });

  afterAll(() => {
    process.env.APP_ENV = originalEnv;
  });

  describe('test Environment (Mocked Central Bank, 5.0% Ceiling Rate)', () => {
    let service;

    beforeEach(() => {
      process.env.APP_ENV = 'test';
      service = new CentralBankService();
    });

    test('should return mock ceiling rate of 5.0% without network calls', async () => {
      const result = await service.getCeilingRate();
      expect(result.ceilingRate).toBe(5.0);
      expect(result.currency).toBe('USD');
      expect(result.source).toBe('MOCK_INTERNAL');
      expect(result.env).toBe('test');
    });

    test('should calculate Savings rate for Tier 1 (ceilingRate - 1% = 4.00%)', async () => {
      const rate = await service.calculateInterestRate('SAVINGS', 1);
      expect(rate).toBe(4.00);
    });

    test('should calculate Savings rate for Tier 2 (ceilingRate - 2% = 3.00%)', async () => {
      const rate = await service.calculateInterestRate('SAVINGS', 2);
      expect(rate).toBe(3.00);
    });

    test('should return 0.00% for Checking accounts regardless of margin tier', async () => {
      const rateTier1 = await service.calculateInterestRate('CHECKING', 1);
      const rateTier2 = await service.calculateInterestRate('CHECKING', 2);
      expect(rateTier1).toBe(0.00);
      expect(rateTier2).toBe(0.00);
    });
  });

  describe('intg and uat Environments (Sandbox Central Bank API, 5.5% Ceiling Rate)', () => {
    test('should calculate Savings rate for Tier 1 against 5.5% ceiling (5.5 - 1% = 4.50%)', async () => {
      const mockSandboxService = new CentralBankService();
      // Stub getCeilingRate to simulate live sandbox returning 5.5
      jest.spyOn(mockSandboxService, 'getCeilingRate').mockResolvedValue({
        ceilingRate: 5.5,
        currency: 'USD',
        source: 'LIVE_SANDBOX',
        env: 'intg'
      });

      const rateTier1 = await mockSandboxService.calculateInterestRate('SAVINGS', 1);
      expect(rateTier1).toBe(4.50);

      const rateTier2 = await mockSandboxService.calculateInterestRate('SAVINGS', 2);
      expect(rateTier2).toBe(3.50);

      const checkingRate = await mockSandboxService.calculateInterestRate('CHECKING', 1);
      expect(checkingRate).toBe(0.00);
    });
  });
});
