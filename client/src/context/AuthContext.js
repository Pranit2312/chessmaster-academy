import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api'; // 🔥 use central API

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // ======================
  // LOAD USER
  // ======================
  const loadUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
    } catch (error) {
      console.error('Load user error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // EFFECT
  // ======================
  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token, loadUser]); // ✅ FIXED WARNING

  // ======================
  // REGISTER
  // ======================
  const register = async (userData) => {
    try {
      const { data } = await authAPI.register(userData);

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // ======================
  // LOGIN
  // ======================
  const login = async (credentials) => {
  try {
    const { data } = await authAPI.login(credentials);

    console.log("LOGIN RESPONSE =", data);

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);

    return { success: true };
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return {
      success: false,
      message: error.response?.data?.message || 'Login failed'
    };
  }
};

  // ======================
  // LOGOUT
  // ======================
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isCoach: user?.role === 'coach',
        isStudent: user?.role === 'student'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;