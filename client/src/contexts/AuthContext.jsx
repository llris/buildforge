import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Attempt to refresh on initial load
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        if (mounted) {
          setAccessToken(data.data.accessToken);
          setUser(data.data.user);
        }
      } catch (err) {
        // No valid session, stay logged out
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    initAuth();
    
    return () => { mounted = false; };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (email, password) => {
    const { data } = await api.post('/auth/register', { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
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
