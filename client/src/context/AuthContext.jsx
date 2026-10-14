import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bugtrack_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('bugtrack_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('bugtrack_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
          localStorage.setItem('bugtrack_user', JSON.stringify(res.data.data));
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, ...userData } = res.data.data;
    setToken(receivedToken);
    setUser(userData);
    localStorage.setItem('bugtrack_token', receivedToken);
    localStorage.setItem('bugtrack_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (name, email, password, role = 'Developer') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { token: receivedToken, ...userData } = res.data.data;
    setToken(receivedToken);
    setUser(userData);
    localStorage.setItem('bugtrack_token', receivedToken);
    localStorage.setItem('bugtrack_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bugtrack_token');
    localStorage.removeItem('bugtrack_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
