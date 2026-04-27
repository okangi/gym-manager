import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for both possible storage keys for compatibility
    let storedToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    let storedUser = localStorage.getItem('userData') || localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const userData = typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser;
        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Ensure both storage formats exist for compatibility
        localStorage.setItem('authToken', storedToken);
        localStorage.setItem('token', storedToken);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('user', JSON.stringify(userData));
        
        verifyToken(storedToken);
      } catch (error) {
        console.error('Error loading stored auth data:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const verifyToken = async (authToken) => {
    try {
      const response = await authAPI.getProfile(authToken);
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        // Update both storage formats
        localStorage.setItem('userData', JSON.stringify(response.user));
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  };
  const forceRefresh = async () => {
  const currentToken = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (currentToken) {
    try {
      const response = await authAPI.getProfile(currentToken);
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.user));
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('Force refresh completed:', response.user.currentPlanName);
        return response.user;
      }
    } catch (error) {
      console.error('Error in force refresh:', error);
    }
  }
  return null;
};

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.success) {
        // Store in both formats for compatibility
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('token', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        
        return { success: true, user: response.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.success) {
        // Store in both formats for compatibility
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('token', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        
        return { success: true, user: response.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (currentToken) {
      try {
        const response = await authAPI.getProfile(currentToken);
        if (response.success) {
          setUser(response.user);
          setIsAuthenticated(true);
          // Update both storage formats
          localStorage.setItem('userData', JSON.stringify(response.user));
          localStorage.setItem('user', JSON.stringify(response.user));
          console.log('User refreshed:', response.user);
          return response.user;
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading, 
      login, 
      register,
      logout, 
      refreshUser,
      forceRefresh,
      token 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}