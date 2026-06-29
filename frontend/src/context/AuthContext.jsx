import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from './ToastContext';

const AuthContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  // Configure axios defaults when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user data on startup if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`);
        setUser(res.data);
      } catch (err) {
        console.error('Session restore failed:', err);
        // Clear expired token
        setToken(null);
        setUser(null);
        showToast('Session expired, please login again.', 'warning');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token, showToast]);

  // Login Manager
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      showToast(`Welcome back, ${res.data.user.name}!`, 'success');
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed. Please check credentials.';
      showToast(errMsg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register Manager
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, { name, email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      showToast('Registration successful! Welcome.', 'success');
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed. Try again.';
      showToast(errMsg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout Manager
  const logout = () => {
    setToken(null);
    setUser(null);
    showToast('Logged out successfully.', 'info');
  };

  // Update Profile Settings
  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/auth/update-profile`, profileData);
      setUser(res.data.user);
      showToast(res.data.message || 'Profile updated successfully', 'success');
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to update profile settings.';
      showToast(errMsg, 'error');
      return false;
    }
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
        updateProfile,
        apiBaseUrl: API_BASE_URL
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
