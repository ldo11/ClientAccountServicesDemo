import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/accounts" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password,
      });
      const { token, client } = response.data;
      login(token, client);
      navigate('/accounts');
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Unable to login. Please verify your credentials.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            CF
          </div>
          <h1
            id="login-heading"
            data-testid="login-heading"
            className="text-2xl font-bold text-slate-900"
          >
            Sign In to Banking Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Charlotte FinTech Client Account Services
          </p>
        </div>

        {errorMsg && (
          <div
            id="login-error-msg"
            data-testid="login-error-msg"
            role="alert"
            className="mb-5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {errorMsg}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-username"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Username
            </label>
            <input
              id="login-username"
              name="username"
              data-testid="login-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="login-password"
              name="password"
              data-testid="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            />
          </div>

          <button
            id="login-submit-btn"
            data-testid="login-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-4 text-sm shadow-sm transition-colors cursor-pointer"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to Charlotte FinTech?{' '}
          <Link
            id="link-to-register"
            data-testid="link-to-register"
            to="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Open an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
