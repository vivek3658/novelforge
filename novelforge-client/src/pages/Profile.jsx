import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi, getBaseUrl, setBaseUrl, resetBaseUrl } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, token, logout, fetchMe, refreshSession, setUser } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);
  const [meLoading, setMeLoading] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(getBaseUrl());

  // Reload user info on mount
  useEffect(() => {
    handleFetchMe(false);
  }, []);

  const handleFetchMe = async (showToast = true) => {
    setMeLoading(true);
    try {
      const data = await authApi.getMe();
      if (data) {
        setUser(data);
        if (showToast) success('Fetched latest /auth/me user profile');
      }
    } catch (err) {
      if (showToast) error(err.message || 'Failed to fetch /auth/me');
    } finally {
      setMeLoading(false);
    }
  };

  const handleTestRefresh = async () => {
    setRefreshLoading(true);
    setRefreshResult(null);
    try {
      const result = await refreshSession();
      if (result) {
        setRefreshResult({
          status: 'SUCCESS 200 OK',
          timestamp: new Date().toLocaleTimeString(),
          message: 'Refresh token HttpOnly cookie valid! New access token received.',
          data: result,
        });
        success('Access token successfully refreshed via HttpOnly cookie!');
      } else {
        setRefreshResult({
          status: 'FAILED',
          timestamp: new Date().toLocaleTimeString(),
          message: 'No active refresh cookie found or session expired.',
        });
        error('Refresh failed: No valid refresh cookie');
      }
    } catch (err) {
      setRefreshResult({
        status: 'ERROR',
        timestamp: new Date().toLocaleTimeString(),
        message: err.message,
      });
      error(err.message || 'Refresh failed');
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    if (customApiUrl.trim()) {
      setBaseUrl(customApiUrl.trim());
      success(`API Base URL set to: ${customApiUrl.trim()}`);
    }
  };

  const handleResetApiUrl = () => {
    resetBaseUrl();
    setCustomApiUrl(getBaseUrl());
    info(`API URL reset to default (${getBaseUrl()})`);
  };

  return (
    <div className="profile-page-container app-container">
      <div className="profile-grid">
        {/* Sidebar User Summary Card */}
        <aside className="profile-card">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-large">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <h2 className="profile-name">{user?.username || 'Novelist'}</h2>
            <p className="profile-email">{user?.email || 'reader@novelforge.com'}</p>

            <div className="profile-badges">
              <span className="badge badge-role">
                ★ {user?.roleType || 'READER'}
              </span>
              <span className="badge badge-status">
                ● {user?.accountStatus || 'ACTIVE'}
              </span>
              {user?.emailVerified && (
                <span className="badge badge-verified">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          <nav className="profile-menu">
            <button
              className={`profile-menu-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Account Overview (/me)
            </button>

            <button
              className={`profile-menu-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Token & Cookie Diagnostics
            </button>

            <button
              className={`profile-menu-btn ${activeTab === 'library' ? 'active' : ''}`}
              onClick={() => setActiveTab('library')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              My Reading Library
            </button>

            <button onClick={handleLogout} className="profile-menu-btn logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="profile-content">
          {/* TAB 1: OVERVIEW (/me) */}
          {activeTab === 'overview' && (
            <>
              <div className="content-card">
                <div className="card-title-row">
                  <h3 className="content-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Identity Profile (`GET /api/v1/identity/auth/me`)
                  </h3>
                  <button
                    className="action-btn-secondary"
                    onClick={() => handleFetchMe(true)}
                    disabled={meLoading}
                  >
                    {meLoading ? <span className="spinner-sm"></span> : '↻'} Refresh Me
                  </button>
                </div>

                <div className="info-grid">
                  <div className="info-box">
                    <div className="info-label">User ID</div>
                    <div className="info-value">#{user?.id || '—'}</div>
                  </div>

                  <div className="info-box">
                    <div className="info-label">Username</div>
                    <div className="info-value">{user?.username || '—'}</div>
                  </div>

                  <div className="info-box">
                    <div className="info-label">Email Address</div>
                    <div className="info-value">{user?.email || '—'}</div>
                  </div>

                  <div className="info-box">
                    <div className="info-label">Role Type</div>
                    <div className="info-value">{user?.roleType || 'READER'}</div>
                  </div>

                  <div className="info-box">
                    <div className="info-label">Email Verified</div>
                    <div className="info-value" style={{ color: user?.emailVerified ? 'var(--success)' : 'var(--danger)' }}>
                      {user?.emailVerified ? 'Yes (Verified)' : 'No (Unverified)'}
                    </div>
                  </div>

                  <div className="info-box">
                    <div className="info-label">Account Status</div>
                    <div className="info-value" style={{ color: 'var(--primary)' }}>
                      {user?.accountStatus || 'ACTIVE'}
                    </div>
                  </div>
                </div>
              </div>

              {/* API Configuration Switcher Card */}
              <div className="content-card">
                <div className="card-title-row">
                  <h3 className="content-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    API Endpoint Configuration
                  </h3>
                </div>

                <form onSubmit={handleSaveApiUrl} className="api-config-row">
                  <input
                    type="text"
                    className="api-input"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    placeholder="http://localhost:8080/api/v1/identity"
                  />
                  <button type="submit" className="action-btn-emerald">
                    Save API URL
                  </button>
                  <button
                    type="button"
                    onClick={handleResetApiUrl}
                    className="action-btn-secondary"
                  >
                    Reset Default
                  </button>
                </form>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  Default Gateway: <code>http://localhost:8080/api/v1/identity</code> | Direct Identity Service: <code>http://localhost:8081/api/v1/identity</code>
                </p>
              </div>
            </>
          )}

          {/* TAB 2: SECURITY & REFRESH TOKEN COOKIE TEST */}
          {activeTab === 'security' && (
            <div className="content-card">
              <div className="card-title-row">
                <h3 className="content-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  HttpOnly Cookie & Refresh Token Diagnostic
                </h3>
              </div>

              <div className="token-test-box">
                <p className="token-test-desc">
                  The NovelForge Identity Service issues a secure <strong>HttpOnly Cookie</strong> named <code>refreshToken</code> during Login & Registration. When you click the button below, the client invokes <code>POST /api/v1/identity/auth/refresh</code> with credentials included.
                </p>

                <div className="token-action-row">
                  <button
                    className="action-btn-emerald"
                    onClick={handleTestRefresh}
                    disabled={refreshLoading}
                  >
                    {refreshLoading ? (
                      <>
                        <span className="spinner-sm"></span>
                        <span>Refreshing Token...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Test Cookie Refresh Token (`/auth/refresh`)</span>
                      </>
                    )}
                  </button>
                </div>

                {refreshResult && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      Response Output:
                    </h4>
                    <pre className="code-output-block">
                      {JSON.stringify(refreshResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Current In-Memory Access Token:
                </h4>
                <pre className="code-output-block">
                  {token ? `Bearer ${token}` : 'No active access token'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: READING LIBRARY */}
          {activeTab === 'library' && (
            <div className="content-card">
              <div className="card-title-row">
                <h3 className="content-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  My Bookshelf & Reading Progress
                </h3>
              </div>

              <div className="info-grid">
                <div className="info-box">
                  <div className="info-label">Bookmarks</div>
                  <div className="info-value">12 Chapters</div>
                </div>
                <div className="info-box">
                  <div className="info-label">Reading Time</div>
                  <div className="info-value">18.4 Hours</div>
                </div>
                <div className="info-box">
                  <div className="info-label">Favorite Genres</div>
                  <div className="info-value">Fantasy, Sci-Fi, Cultivation</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;
