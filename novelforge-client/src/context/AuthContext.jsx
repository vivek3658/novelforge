/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('novelforge_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('novelforge_access_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const saveUser = useCallback((u) => {
    setUser(u);
    if (u) {
      localStorage.setItem('novelforge_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('novelforge_user');
    }
  }, []);

  const fetchMe = useCallback(
    async (accessToken) => {
      try {
        const activeToken = accessToken || token || localStorage.getItem('novelforge_access_token');
        if (!activeToken) return null;
        const me = await authApi.getMe(activeToken);
        if (!me) return null;
        const refreshedToken = localStorage.getItem('novelforge_access_token');
        if (refreshedToken) setToken(refreshedToken);
        const profile = await authApi.getProfile(refreshedToken || activeToken).catch(() => null);
        const enriched = { ...me, ...(profile || {}) };
        if (enriched) saveUser(enriched);
        return enriched;
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          saveUser(null);
          setToken(null);
          localStorage.removeItem('novelforge_access_token');
          localStorage.removeItem('novelforge_user');
        }
        return null;
      }
    },
    [token, saveUser]
  );

  const refreshSession = useCallback(async () => {
    try {
      const res = await authApi.refreshToken();
      if (res && res.accessToken) {
        setToken(res.accessToken);
        localStorage.setItem('novelforge_access_token', res.accessToken);
        const me = await fetchMe(res.accessToken);
        if (!me && res.username) {
          saveUser({
            id: res.userId,
            username: res.username,
            roles: ['READER'],
            roleType: 'READER',
          });
        }
        return res;
      }
      return null;
    } catch {
      return null;
    }
  }, [fetchMe, saveUser]);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem('novelforge_access_token');

      let verifiedUser = null;

      if (storedToken) {
        try {
          const me = await authApi.getMe(storedToken);
          if (me) {
            const activeToken = localStorage.getItem('novelforge_access_token') || storedToken;
            const profile = await authApi.getProfile(activeToken).catch(() => null);
            verifiedUser = { ...me, ...(profile || {}) };
            if (active) {
              setToken(activeToken);
              saveUser(verifiedUser);
            }
          }
        } catch {
          // Stored token is invalid or expired: purge it cleanly
          if (active) {
            localStorage.removeItem('novelforge_access_token');
            localStorage.removeItem('novelforge_user');
            setToken(null);
            setUser(null);
          }
        }
      }

      // If storedToken was not valid or not present, try silent refresh via cookie
      if (!verifiedUser && active) {
        try {
          const refreshed = await refreshSession();
          if (!refreshed && active) {
            saveUser(null);
            setToken(null);
          }
        } catch {
          if (active) {
            saveUser(null);
            setToken(null);
          }
        }
      }

      if (active) {
        setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [refreshSession, saveUser]);

  const login = async (identifier, password) => {
    setAuthError(null);
    try {
      const res = await authApi.login({ identifier, password });
      if (res && res.accessToken) {
        setToken(res.accessToken);
        localStorage.setItem('novelforge_access_token', res.accessToken);
        const defaultUser = {
          id: res.userId,
          username: res.username,
          roles: [],
        };
        saveUser(defaultUser);
        fetchMe(res.accessToken)
          .then((u) => u && saveUser(u))
          .catch((err) => console.warn('Background profile enrichment after login deferred:', err.message));
        return res;
      }
      throw new Error('Invalid response from server.');
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const res = await authApi.register(userData);
      if (res && res.accessToken) {
        setToken(res.accessToken);
        localStorage.setItem('novelforge_access_token', res.accessToken);
        const defaultUser = {
          id: res.userId,
          username: res.username || userData.username,
          email: userData.email,
          roles: [],
        };
        saveUser(defaultUser);
        fetchMe(res.accessToken)
          .then((u) => u && saveUser(u))
          .catch((err) => console.warn('Background profile enrichment after register deferred:', err.message));
        return res;
      }
      return res;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      saveUser(null);
      setToken(null);
      localStorage.removeItem('novelforge_access_token');
      localStorage.removeItem('novelforge_user');
    }
  };

  const convertToCreator = async () => {
    await authApi.becomeAuthor();
    await fetchMe();
    return true;
  };

  const roles = user?.roles || (user?.roleType ? [user.roleType] : ['READER']);
  const isCreator = user?.creatorStatus === 'ACTIVE';

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

export { useAuth } from './useAuth';
export default AuthContext;
