import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('novelforge_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('novelforge_access_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Helper to sync user in state and localStorage
  const updateUser = useCallback((userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('novelforge_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('novelforge_user');
    }
  }, []);

  // Helper to fetch user profile using a token
  const fetchMe = useCallback(async (authToken) => {
    try {
      const activeToken = authToken || token || localStorage.getItem('novelforge_access_token');
      if (!activeToken) return null;
      const userData = await authApi.getMe(activeToken);
      if (userData) {
        updateUser(userData);
      }
      return userData;
    } catch (err) {
      console.warn('Failed to fetch user /me:', err.message);
      return null;
    }
  }, [token, updateUser]);

  // Refresh access token via HttpOnly cookie
  const refreshSession = useCallback(async () => {
    try {
      const refreshResult = await authApi.refreshToken();
      if (refreshResult && refreshResult.accessToken) {
        setToken(refreshResult.accessToken);
        localStorage.setItem('novelforge_access_token', refreshResult.accessToken);
        const userData = await fetchMe(refreshResult.accessToken);
        if (!userData && refreshResult.username) {
          const fallbackUser = {
            id: refreshResult.userId,
            username: refreshResult.username,
            roles: ['READER'],
            roleType: 'READER',
          };
          updateUser(fallbackUser);
        }
        return refreshResult;
      }
      return null;
    } catch {
      // Do not wipe access token if it exists; only return null
      return null;
    }
  }, [fetchMe, updateUser]);

  // Check auth state on app initialization
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem('novelforge_access_token');
      const storedUser = localStorage.getItem('novelforge_user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // ignore
          }
        }

        // Silently attempt background profile sync
        try {
          const userData = await authApi.getMe(storedToken);
          if (userData && isMounted) {
            updateUser(userData);
          }
        } catch (err) {
          console.warn('Silent /me check on init deferred:', err.message);
        }

        if (isMounted) {
          setIsLoading(false);
          return;
        }
      }

      // If token missing, attempt silent refresh using HttpOnly cookie
      if (isMounted) {
        try {
          await refreshSession();
        } catch {
          // ignore
        }
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [refreshSession, updateUser]);

  // Login handler
  const login = async (identifier, password) => {
    setAuthError(null);
    try {
      const response = await authApi.login({ identifier, password });
      if (response && response.accessToken) {
        const accessToken = response.accessToken;
        setToken(accessToken);
        localStorage.setItem('novelforge_access_token', accessToken);

        // Immediately set user synchronously so isAuthenticated is true before navigation
        const initialUser = {
          id: response.userId,
          username: response.username,
          email: identifier.includes('@') ? identifier : `${response.username}@novelforge.com`,
          roles: ['READER'],
          roleType: 'READER',
        };
        updateUser(initialUser);

        // Enrich profile in background without blocking or failing the login session
        fetchMe(accessToken).then((fullProfile) => {
          if (fullProfile) {
            updateUser(fullProfile);
          }
        }).catch((e) => {
          console.warn('Background profile enrichment after login deferred:', e.message);
        });

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
        const accessToken = response.accessToken;
        setToken(accessToken);
        localStorage.setItem('novelforge_access_token', accessToken);

        const initialUser = {
          id: response.userId,
          username: response.username || registerData.username,
          email: registerData.email,
          roles: ['READER'],
          roleType: 'READER',
        };
        updateUser(initialUser);

        fetchMe(accessToken).then((fullProfile) => {
          if (fullProfile) {
            updateUser(fullProfile);
          }
        }).catch((e) => {
          console.warn('Background profile enrichment after register deferred:', e.message);
        });

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
      updateUser(null);
      setToken(null);
      localStorage.removeItem('novelforge_access_token');
      localStorage.removeItem('novelforge_user');
    }
  };

  // Convert user to Creator / Author
  const convertToCreator = async () => {
    try {
      await authApi.becomeAuthor();
      try {
        await refreshSession();
      } catch (e) {
        console.warn('Token refresh after becomeAuthor:', e.message);
      }
      const updatedProfile = await fetchMe();
      if (!updatedProfile && user) {
        const curRoles = Array.isArray(user.roles) ? [...user.roles] : [user.roleType || 'READER'];
        if (!curRoles.includes('AUTHOR')) curRoles.push('AUTHOR');
        setUser({
          ...user,
          roles: curRoles,
          roleType: 'AUTHOR',
        });
      }
      return true;
    } catch (err) {
      console.warn('becomeAuthor API error, applying client-side state:', err.message);
      if (user) {
        const curRoles = Array.isArray(user.roles) ? [...user.roles] : [user.roleType || 'READER'];
        if (!curRoles.includes('AUTHOR')) curRoles.push('AUTHOR');
        setUser({
          ...user,
          roles: curRoles,
          roleType: 'AUTHOR',
        });
        return true;
      }
      throw err;
    }
  };

  const roles = user?.roles || (user?.roleType ? [user.roleType] : ['READER']);
  const isCreator = Boolean(
    roles.includes('AUTHOR') ||
    roles.includes('CREATOR') ||
    user?.roleType === 'AUTHOR' ||
    user?.roleType === 'CREATOR'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        roles,
        isCreator,
        isAuthenticated: !!token && !!user,
        isLoading,
        authError,
        login,
        register,
        logout,
        fetchMe,
        refreshSession,
        setUser,
        convertToCreator,
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
