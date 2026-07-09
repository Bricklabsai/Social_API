import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
          try {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser && parsedUser.id) {
              setUser(parsedUser);
              // Verify token is still valid
              const me = await auth.me();
              if (me?.data) {
                const refreshed = { ...parsedUser, ...me.data };
                setUser(refreshed);
                localStorage.setItem('user', JSON.stringify(refreshed));
              }
            }
          } catch (parseError) {
            console.error('Failed to parse user data:', parseError);
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const register = async (email, password, fullName) => {
    try {
      const response = await auth.register({ 
        email, 
        password, 
        full_name: fullName 
      });
      toast.success('Registration successful! Please login.');
      return response.data;
    } catch (error) {
      let errorMessage = 'Registration failed';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map(e => e.msg || e.message).join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await auth.login({ email, password });
      
      const { access_token, user: userData } = response.data;
      
      if (!access_token) {
        throw new Error('No access token received');
      }
      
      if (!userData || !userData.id) {
        throw new Error('No user data received');
      }
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.full_name || userData.email}!`);
      return response.data;
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map(e => e.msg || e.message).join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    const userData = { ...user, ...updatedUser };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};