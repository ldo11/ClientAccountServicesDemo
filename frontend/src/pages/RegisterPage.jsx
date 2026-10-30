import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/accounts" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password || !mobile.trim() || !address.trim()) {
      setErrorMsg('All fields are required to open a client profile');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/register', {
        username: username.trim(),
        password,
        mobile: mobile.trim(),
        address: address.trim(),
      });
      navigate('/login');
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Registration failed. Please try a different username.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            CF
          </div>
          <h1
            id="register-heading"
            data-testid="register-heading"
            className="text-2xl font-bold text-slate-900"
          >
            Create Client Account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Includes Checking &amp; Savings accounts with $1,000.00 starter funds
          </p>
        </div>

        {errorMsg && (
          <div
            id="reg-error-msg"
            data-testid="reg-error-msg"
            role="alert"
            className="mb-5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {errorMsg}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reg-username"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Username
            </label>
            <input
              id="reg-username"
              name="username"
              data-testid="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a unique username"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              data-testid="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="reg-mobile"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Mobile Number
            </label>
            <input
              id="reg-mobile"
              name="mobile"
              data-testid="reg-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 704-555-0142"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="reg-address"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Residential Address
            </label>
            <input
              id="reg-address"
              name="address"
              data-testid="reg-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="100 S Tryon St, Charlotte, NC"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            />
          </div>

          <button
            id="reg-submit-btn"
            data-testid="reg-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-4 text-sm shadow-sm transition-colors cursor-pointer"
          >
            {submitting ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link
            id="link-to-login"
            data-testid="link-to-login"
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
