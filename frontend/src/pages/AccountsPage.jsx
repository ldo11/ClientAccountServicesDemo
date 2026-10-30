import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Account Creation Form Modal / Card
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccountType, setNewAccountType] = useState('SAVINGS');
  const [newAccountBalance, setNewAccountBalance] = useState('500.00');
  const [marginTier, setMarginTier] = useState('1');
  const [creating, setCreating] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(Array.isArray(res.data) ? res.data : res.data.accounts || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Unable to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setCreating(true);

    try {
      const payload = {
        accountType: newAccountType,
        initialBalance: Number(newAccountBalance) || 0,
        marginTier: Number(marginTier)
      };
      const res = await api.post('/accounts', payload);
      setSuccessMsg(res.data?.message || 'Account created successfully');
      setShowCreateModal(false);
      await fetchAccounts();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading your accounts...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1
            id="accounts-page-title"
            data-testid="accounts-page-title"
            className="text-2xl font-bold text-slate-900"
          >
            Account Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time balances and Central Bank compliant interest rates across your accounts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="open-create-account-btn"
            data-testid="open-create-account-btn"
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 shadow-sm transition-colors cursor-pointer"
          >
            + Open New Account
          </button>
          <Link
            id="quick-transfer-btn"
            data-testid="quick-transfer-btn"
            to="/transfer"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 shadow-sm transition-colors"
          >
            Transfer Funds
          </Link>
        </div>
      </div>

      {successMsg && (
        <div
          id="accounts-success-msg"
          data-testid="accounts-success-msg"
          role="status"
          className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          id="accounts-error-msg"
          data-testid="accounts-error-msg"
          role="alert"
          className="mb-6 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {errorMsg}
        </div>
      )}

      {/* Account Creation Modal / Card */}
      {showCreateModal && (
        <div className="mb-8 p-6 bg-white rounded-2xl shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Open a New Bank Account</h2>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreateAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="create-account-type" className="block text-xs font-semibold text-slate-700 mb-1">
                Account Type
              </label>
              <select
                id="create-account-type"
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white outline-none focus:border-indigo-600"
              >
                <option value="SAVINGS">SAVINGS</option>
                <option value="CHECKING">CHECKING</option>
              </select>
            </div>

            {newAccountType === 'SAVINGS' ? (
              <div>
                <label htmlFor="select-rate-margin" className="block text-xs font-semibold text-slate-700 mb-1">
                  Margin Tier (Central Bank Ceiling)
                </label>
                <select
                  id="select-rate-margin"
                  name="select-rate-margin"
                  data-testid="select-rate-margin"
                  value={marginTier}
                  onChange={(e) => setMarginTier(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white outline-none focus:border-indigo-600"
                >
                  <option value="1">Tier 1: 1% below ceiling rate</option>
                  <option value="2">Tier 2: 2% below ceiling rate</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Fixed Rate
                </label>
                <input
                  type="text"
                  disabled
                  value="0.00% (Checking Standard)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="create-initial-balance" className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Deposit ($)
              </label>
              <input
                id="create-initial-balance"
                type="number"
                step="0.01"
                min="0"
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-600"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                id="submit-create-account-btn"
                data-testid="submit-create-account-btn"
                type="submit"
                disabled={creating}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {creating ? 'Creating...' : 'Confirm & Open Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((account) => {
          const type = account.accountType;
          const isChecking = type === 'CHECKING';
          const formattedBalance = Number(account.balance).toFixed(2);
          const interestRate = Number(account.interestRate || 0).toFixed(2);

          return (
            <div
              key={account.accountId}
              id={`account-card-${type}`}
              data-testid={`account-card-${type}`}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                      isChecking
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {type} ACCOUNT
                  </span>
                  <span
                    id={`account-number-${type}`}
                    data-testid={`account-number-${type}`}
                    className="text-xs font-mono text-slate-500"
                  >
                    {account.accountNumber}
                  </span>
                </div>

                <div className="mt-2">
                  <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Available Balance
                  </span>
                  <div className="mt-1 text-3xl font-bold text-slate-900 tracking-tight">
                    <span>$</span>
                    <span
                      id={`balance-${type}`}
                      data-testid={`balance-${type}`}
                    >
                      {formattedBalance}
                    </span>
                  </div>
                </div>

                {/* Display Applied Interest Rate with exact required locator */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Annual Percentage Yield (APY):
                  </span>
                  <span
                    id="account-interest-rate"
                    data-testid="account-interest-rate"
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800"
                  >
                    {interestRate}%
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Central Bank Compliant</span>
                <Link
                  id={`view-details-${type}`}
                  data-testid={`view-details-${type}`}
                  to={`/accounts/${account.accountId}`}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
