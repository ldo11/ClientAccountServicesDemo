import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountsPage from './pages/AccountsPage';
import AccountDetailPage from './pages/AccountDetailPage';
import ClientProfilePage from './pages/ClientProfilePage';
import TransferPage from './pages/TransferPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/accounts"
                element={
                  <ProtectedRoute>
                    <AccountsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounts/:accountId"
                element={
                  <ProtectedRoute>
                    <AccountDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ClientProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transfer"
                element={
                  <ProtectedRoute>
                    <TransferPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/accounts" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
