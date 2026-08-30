import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('novelforge_access_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Helper to fetch user profile using a token
  const fetchMe = useCallback(async (authToken) => {
    try {
      const activeToken = authToken || token || localStorage.getItem('novelforge_access_token');
      if (!activeToken) return null;
      const userData = await authApi.getMe(activeToken);
      setUser(userData);
      return userData;
    } catch (err) {
      console.warn('Failed to fetch user /me:', err.message);
      return null;
    }
  }, [token]);

  // Refresh access token via HttpOnly cookie
  const refreshSession = useCallback(async () => {
    try {
      const refreshResult = await authApi.refreshToken();
      if (refreshResult && refreshResult.accessToken) {
        setToken(refreshResult.accessToken);
        localStorage.setItem('novelforge_access_token', refreshResult.accessToken);
        const userData = await fetchMe(refreshResult.accessToken);
        if (!userData && refreshResult.username) {
          setUser({
            id: refreshResult.userId,
            username: refreshResult.username,
          });
        }
        return refreshResult;
      }
      return null;
    } catch (err) {
      // Refresh token cookie is missing, expired, or invalid
      setToken(null);
      setUser(null);
      localStorage.removeItem('novelforge_access_token');
      return null;
    }
  }, [fetchMe]);

  // Check auth state on app initialization
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem('novelforge_access_token');

      if (storedToken) {
        const userData = await fetchMe(storedToken);
        if (userData && isMounted) {
          setToken(storedToken);
          setIsLoading(false);
          return;
        }
      }

      // If token missing or expired, attempt silent refresh using HttpOnly cookie
      if (isMounted) {
        await refreshSession();
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchMe, refreshSession]);

  // Login handler
  const login = async (identifier, password) => {
    setAuthError(null);
    try {
      const response = await authApi.login({ identifier, password });
      if (response && response.accessToken) {
        setToken(response.accessToken);
        localStorage.setItem('novelforge_access_token', response.accessToken);

        // Fetch full profile info (/me)
        const fullProfile = await fetchMe(response.accessToken);
        if (!fullProfile) {
          setUser({
            id: response.userId,
            username: response.username,
          });
        }
        return response;
      }
      throw new Error('Invalid response from server.');
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Register handler
  const register = async (registerData) => {
    setAuthError(null);
    try {
      const response = await authApi.register(registerData);
      if (response && response.accessToken) {
        setToken(response.accessToken);
        localStorage.setItem('novelforge_access_token', response.accessToken);

        const fullProfile = await fetchMe(response.accessToken);
        if (!fullProfile) {
          setUser({
            id: response.userId,
            username: response.username,
          });
        }
        return response;
      }
      return response;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('novelforge_access_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        authError,
        login,
        register,
        logout,
        fetchMe,
        refreshSession,
        setUser,
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
