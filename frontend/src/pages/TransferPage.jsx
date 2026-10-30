import React, { useEffect, useState } from 'react';
import api from '../api';

export default function TransferPage() {
  const [accounts, setAccounts] = useState([]);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAccounts = async (preserveSelection = false) => {
    try {
      const res = await api.get('/accounts');
      const list = Array.isArray(res.data) ? res.data : res.data.accounts || [];
      setAccounts(list);

      if (!preserveSelection && list.length > 0) {
        const checking = list.find((a) => a.accountType === 'CHECKING');
        const savings = list.find((a) => a.accountType === 'SAVINGS');
        setFromAccountId(checking ? checking.accountId : list[0].accountId);
        setToAccountId(
          savings
            ? savings.accountId
            : list.length > 1
            ? list[1].accountId
            : list[0].accountId
        );
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Unable to load accounts for transfer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!fromAccountId || !toAccountId) {
      setErrorMsg('Please select both source and destination accounts');
      return;
    }

    if (fromAccountId === toAccountId) {
      setErrorMsg('Source and destination accounts cannot be the same');
      return;
    }

    const numericAmount = Number(amount);
    if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid transfer amount greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/accounts/transfer', {
        fromAccountId,
        toAccountId,
        amount: numericAmount,
      });
      setSuccessMsg('Transfer completed successfully');
      setAmount('');
      await fetchAccounts(true);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || 'Transfer failed. Please check account balances.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading transfer accounts...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1
          id="transfer-page-title"
          data-testid="transfer-page-title"
          className="text-2xl font-bold text-slate-900"
        >
          Transfer Funds
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Move funds instantly and atomically between your accounts.
        </p>
      </div>

      {successMsg && (
        <div
          id="transfer-success-msg"
          data-testid="transfer-success-msg"
          role="status"
          className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          id="transfer-error-msg"
          data-testid="transfer-error-msg"
          role="alert"
          className="mb-6 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <form noValidate onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="transfer-from-account"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              From Account
            </label>
            <select
              id="transfer-from-account"
              name="fromAccountId"
              data-testid="transfer-from-account"
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            >
              {accounts.map((acc) => (
                <option key={acc.accountId} value={acc.accountId}>
                  {acc.accountType} ({acc.accountNumber}) - ${Number(acc.balance).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="transfer-to-account"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              To Account
            </label>
            <select
              id="transfer-to-account"
              name="toAccountId"
              data-testid="transfer-to-account"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            >
              {accounts.map((acc) => (
                <option key={acc.accountId} value={acc.accountId}>
                  {acc.accountType} ({acc.accountNumber}) - ${Number(acc.balance).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="transfer-amount"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Transfer Amount (USD)
            </label>
            <input
              id="transfer-amount"
              name="amount"
              data-testid="transfer-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            />
          </div>

          <div className="pt-2">
            <button
              id="transfer-submit-btn"
              data-testid="transfer-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-4 text-sm shadow-sm transition-colors cursor-pointer"
            >
              {submitting ? 'Processing Transfer...' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
