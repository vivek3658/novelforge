/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, profileApi, accountApi } from '../services/api';

const AuthContext = createContext();

const STORAGE_TOKEN_KEY = 'novelforge_access_token';
const STORAGE_USER_KEY = 'novelforge_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync user object with localStorage
  const updateUser = useCallback((userData) => {
    setUser(userData);
    if (userData) {
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
      } catch (e) {
        console.warn('Storage save failed:', e);
      }
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
      setProfile(null);
    }
  }, []);

  // Fetch full user profile from backend (/api/v1/identity/profile/me)
  const fetchProfile = useCallback(async () => {
    try {
      const profileData = await profileApi.getMyProfile();
      if (profileData) {
        setProfile(profileData);
      }
      return profileData;
    } catch (err) {
      console.warn('Could not fetch user profile details:', err.message);
      return null;
    }
  }, []);

  // Fetch /me account information from backend (/api/v1/identity/auth/me)
  const fetchMe = useCallback(async (activeToken) => {
    try {
      const currentToken = activeToken || token || localStorage.getItem(STORAGE_TOKEN_KEY);
      if (!currentToken) return null;
      const meData = await authApi.getMe(currentToken);
      if (meData) {
        updateUser(meData);
        // Also fetch user profile in parallel
        fetchProfile();
      }
      return meData;
    } catch (err) {
      console.warn('Failed to fetch /me:', err.message);
      return null;
    }
  }, [token, updateUser, fetchProfile]);

  // Refresh access token via backend HttpOnly refresh cookie
  const refreshSession = useCallback(async () => {
    try {
      const refreshResult = await authApi.refreshToken();
      if (refreshResult && refreshResult.accessToken) {
        setToken(refreshResult.accessToken);
        localStorage.setItem(STORAGE_TOKEN_KEY, refreshResult.accessToken);
        await fetchMe(refreshResult.accessToken);
        return refreshResult;
      }
      return null;
    } catch {
      return null;
    }
  }, [fetchMe]);

  // Initialize auth on page mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);

      if (storedToken) {
        setToken(storedToken);
        try {
          const userData = await authApi.getMe(storedToken);
          if (userData && isMounted) {
            updateUser(userData);
            const prof = await profileApi.getMyProfile();
            if (prof && isMounted) {
              setProfile(prof);
            }
          }
        } catch {
          // If stored access token is invalid or expired, attempt refresh via HttpOnly cookie
          if (isMounted) {
            try {
              await refreshSession();
            } catch {
              // ignore
            }
          }
        }
      } else {
        // No stored access token; check if valid HttpOnly refresh cookie exists
        try {
          await refreshSession();
        } catch {
          // ignore
        }
      }

      if (isMounted) {
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
        localStorage.setItem(STORAGE_TOKEN_KEY, accessToken);

        // Seed initial user data while waiting for background /me
        const initialUser = {
          id: response.userId,
          username: response.username,
          email: identifier.includes('@') ? identifier : `${response.username}@novelforge.com`,
          roles: ['USER'],
          accountStatus: 'ACTIVE',
        };
        updateUser(initialUser);

        // Fetch authoritative profile and /me
        fetchMe(accessToken);

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
        localStorage.setItem(STORAGE_TOKEN_KEY, accessToken);

        const initialUser = {
          id: response.userId,
          username: response.username || registerData.username,
          email: registerData.email,
          roles: ['USER'],
          accountStatus: 'ACTIVE',
        };
        updateUser(initialUser);
        fetchMe(accessToken);
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
      setProfile(null);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  };

  // Activate Creator status (calls real POST /api/v1/identity/profile/creator)
  const activateCreator = async () => {
    const updatedProfile = await profileApi.activateCreator();
    setProfile(updatedProfile);
    return updatedProfile;
  };

  // Deactivate Creator status (calls real POST /api/v1/identity/profile/creator/deactivate)
  const deactivateCreator = async () => {
    const updatedProfile = await profileApi.deactivateCreator();
    setProfile(updatedProfile);
    return updatedProfile;
  };

  // Update profile details (calls real PATCH /api/v1/identity/profile/me)
  const updateProfile = async ({ displayName, bio, visibility }) => {
    const updatedProfile = await profileApi.updateMyProfile({ displayName, bio, visibility });
    setProfile(updatedProfile);
    return updatedProfile;
  };

  // Request account deletion (calls real DELETE /api/v1/identity/account)
  const requestAccountDeletion = async () => {
    const result = await accountApi.requestDeletion();
    await fetchMe();
    return result;
  };

  // Cancel account deletion (calls real POST /api/v1/identity/account/cancel-deletion)
  const cancelAccountDeletion = async () => {
    const result = await accountApi.cancelDeletion();
    await fetchMe();
    return result;
  };

  const roles = user?.roles || ['USER'];
  const isCreator = profile?.creatorStatus === 'ACTIVE';
  const isPendingDeletion = user?.accountStatus === 'PENDING_DELETION';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        roles,
        isCreator,
        isPendingDeletion,
        accountStatus: user?.accountStatus || 'ACTIVE',
        isAuthenticated: !!token && !!user,
        isLoading,
        authError,
        login,
        register,
        logout,
        fetchMe,
        fetchProfile,
        refreshSession,
        activateCreator,
        deactivateCreator,
        updateProfile,
        requestAccountDeletion,
        cancelAccountDeletion,
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

export default AuthContext;
