import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Hardcoded admin credentials
const ADMIN_EMAIL = 'mahmoud@jizawi.com';
const ADMIN_PASSWORD = 'MD@123';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (stored in localStorage)
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('adminUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simple hardcoded authentication
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = {
        id: 'admin-001',
        name: 'Administrator',
        email: ADMIN_EMAIL,
        role: 'admin'
      };

      localStorage.setItem('adminUser', JSON.stringify(adminUser));
      setUser(adminUser);
      return { success: true, user: adminUser };
    } else {
      throw new Error('Invalid email or password');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminUser');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: !!user // Since there's only one user, they're always admin if logged in
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
