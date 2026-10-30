import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [clientId, setClientId] = useState(() => localStorage.getItem('clientId'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = (jwtToken, clientData) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('clientId', clientData.clientId);
    localStorage.setItem('user', JSON.stringify(clientData));
    setToken(jwtToken);
    setClientId(clientData.clientId);
    setUser(clientData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('clientId');
    localStorage.removeItem('user');
    setToken(null);
    setClientId(null);
    setUser(null);
  };

  const updateStoredUser = (updatedData) => {
    const merged = { ...(user || {}), ...updatedData };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  };

  const isAuthenticated = Boolean(token && clientId);

  return (
    <AuthContext.Provider
      value={{
        token,
        clientId,
        user,
        isAuthenticated,
        login,
        logout,
        updateStoredUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
