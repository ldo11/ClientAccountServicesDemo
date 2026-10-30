import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = (pathPrefix) => {
    const active = location.pathname.startsWith(pathPrefix);
    return `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
    }`;
  };

  return (
    <header
      id="main-navbar"
      data-testid="main-navbar"
      className="bg-slate-900 text-white shadow-md border-b border-slate-800"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-lg tracking-tight">
            CF
          </div>
          <div>
            <span className="font-semibold text-base tracking-tight block leading-none">
              Charlotte FinTech
            </span>
            <span className="text-xs text-slate-400">Core Banking Portal</span>
          </div>
        </div>

        <nav className="flex items-center space-x-2">
          <Link
            id="nav-accounts"
            data-testid="nav-accounts"
            to="/accounts"
            className={linkClass('/accounts')}
          >
            Accounts
          </Link>
          <Link
            id="nav-transfer"
            data-testid="nav-transfer"
            to="/transfer"
            className={linkClass('/transfer')}
          >
            Transfer Funds
          </Link>
          <Link
            id="nav-profile"
            data-testid="nav-profile"
            to="/profile"
            className={linkClass('/profile')}
          >
            Client Profile
          </Link>

          <div className="h-5 w-px bg-slate-700 mx-2 hidden sm:block" />

          {user?.username && (
            <span
              id="nav-username-display"
              data-testid="nav-username-display"
              className="text-xs text-slate-300 hidden md:inline mr-2"
            >
              {user.username}
            </span>
          )}

          <button
            id="nav-logout"
            data-testid="nav-logout"
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
