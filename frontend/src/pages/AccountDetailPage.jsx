import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

export default function AccountDetailPage() {
  const { accountId } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await api.get(`/accounts/${accountId}`);
        if (active) {
          setAccount(res.data);
        }
      } catch (err) {
        if (active) {
          setErrorMsg(err.response?.data?.message || 'Unable to load account details');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    if (accountId) {
      fetchDetail();
    }
    return () => {
      active = false;
    };
  }, [accountId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading account statement...
      </div>
    );
  }

  if (errorMsg || !account) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div
          id="account-detail-error"
          data-testid="account-detail-error"
          role="alert"
          className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700 mb-4"
        >
          {errorMsg || 'Account not found'}
        </div>
        <Link
          id="back-to-accounts-link"
          data-testid="back-to-accounts-link"
          to="/accounts"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          &larr; Back to Accounts
        </Link>
      </div>
    );
  }

  const transactions = account.transactions || [];
  const formattedBalance = Number(account.balance).toFixed(2);
  const interestRate = Number(account.interestRate || 0).toFixed(2);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          id="back-to-accounts-link"
          data-testid="back-to-accounts-link"
          to="/accounts"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center"
        >
          &larr; Back to Accounts Overview
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Account Type
            </span>
            <h1
              id="detail-account-type"
              data-testid="detail-account-type"
              className="text-2xl font-bold text-slate-900 mt-0.5"
            >
              {account.accountType}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Account Number:{' '}
              <span
                id="detail-account-number"
                data-testid="detail-account-number"
                className="font-mono font-semibold text-slate-700"
              >
                {account.accountNumber}
              </span>
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Interest Rate (APY):{' '}
              <span
                id="account-interest-rate"
                data-testid="account-interest-rate"
                className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md"
              >
                {interestRate}%
              </span>
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Current Balance
            </span>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">
              <span>$</span>
              <span
                id="detail-account-balance"
                data-testid="detail-account-balance"
              >
                {formattedBalance}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Transactions (Last 10)</h2>
          <span className="text-xs text-slate-500">{transactions.length} record(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table
            id="transactions-table"
            data-testid="transactions-table"
            className="w-full text-left border-collapse"
          >
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="px-6 py-3">Date / Time</th>
                <th className="px-6 py-3">Direction</th>
                <th className="px-6 py-3">From Account</th>
                <th className="px-6 py-3">To Account</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No transactions recorded for this account yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isDebit = tx.fromAccountId === account.accountId;
                  return (
                    <tr
                      key={tx.transactionId}
                      data-testid={`tx-row-${tx.transactionId}`}
                      className="hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isDebit
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isDebit ? 'DEBIT' : 'CREDIT'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-600">
                        {tx.fromAccountType ? `${tx.fromAccountType} ` : ''}
                        ({tx.fromAccountNumber || tx.fromAccountId})
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-600">
                        {tx.toAccountType ? `${tx.toAccountType} ` : ''}
                        ({tx.toAccountNumber || tx.toAccountId})
                      </td>
                      <td
                        className={`px-6 py-3.5 text-right font-semibold whitespace-nowrap ${
                          isDebit ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isDebit ? '-' : '+'}${Number(tx.amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
