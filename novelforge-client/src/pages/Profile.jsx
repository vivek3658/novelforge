import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getBaseUrl, setBaseUrl, resetBaseUrl } from '../services/api';
import { novelStore } from '../services/novelStore';
import './Profile.css';
import './Home.css';

const Profile = () => {
  const { user, token, isCreator, logout, refreshSession, convertToCreator } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab navigation
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // States
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(getBaseUrl());
  const [showDevTools, setShowDevTools] = useState(false);
  const [showFullToken, setShowFullToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  // Creator novels state
  const [creatorNovels, setCreatorNovels] = useState([]);
  const [novelsLoading, setNovelsLoading] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [novelForm, setNovelForm] = useState({
    title: '',
    categoryType: 'FICTION',
    synopsis: '',
  });

  const loadCreatorNovels = useCallback(async () => {
    setNovelsLoading(true);
    try {
      const { novels } = await novelStore.loadAllNovels();
      const username = user?.username;
      const userAuthored = novels.filter(
        (n) => n.isUserCreated || (username && n.author === username)
      );
      setCreatorNovels(userAuthored);
    } catch (err) {
      console.warn('Could not load publications:', err.message);
    } finally {
      setNovelsLoading(false);
    }
  }, [user?.username]);

  // Load creator novels on mount / user change
  useEffect(() => {
    loadCreatorNovels();
  }, [loadCreatorNovels]);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab && ['overview', 'creator', 'library', 'security'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Convert to Creator / Author
  const handleBecomeCreator = async () => {
    setConvertLoading(true);
    try {
      await convertToCreator();
      success('🎉 Welcome to the Creator Studio! Author privileges unlocked.');
      setActiveTab('creator');
      loadCreatorNovels();
    } catch (err) {
      error(err.message || 'Failed to activate Creator account');
    } finally {
      setConvertLoading(false);
    }
  };

  // Refresh session handler
  const handleTestRefresh = async () => {
    setRefreshLoading(true);
    try {
      const result = await refreshSession();
      if (result) {
        success('Session key refreshed successfully via secure HttpOnly cookie');
      } else {
        info('Session is active. Refresh cookie cycle checked.');
      }
    } catch (err) {
      error(err.message || 'Session refresh cycle failed');
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    success('Signed out successfully');
    navigate('/login');
  };

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    if (customApiUrl.trim()) {
      setBaseUrl(customApiUrl.trim());
      success(`API Endpoint updated: ${customApiUrl.trim()}`);
    }
  };

  const handleResetApiUrl = () => {
    resetBaseUrl();
    setCustomApiUrl(getBaseUrl());
    info(`API URL reset to production gateway (${getBaseUrl()})`);
  };

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setTokenCopied(true);
      success('Token copied to clipboard');
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  // Novel Modals handlers
  const handleOpenCreateNovel = () => {
    setNovelForm({
      title: '',
      categoryType: 'FICTION',
      synopsis: '',
    });
    setShowCreateModal(true);
  };

  const handleOpenEditNovel = (novel) => {
    setSelectedNovel(novel);
    setNovelForm({
      title: novel.title,
      categoryType: novel.categoryType || 'FICTION',
      synopsis: novel.synopsis,
    });
    setShowEditModal(true);
  };

  const handleOpenDeleteNovel = (novel) => {
    setSelectedNovel(novel);
    setShowDeleteModal(true);
  };

  const handleCreateNovelSubmit = async (e) => {
    e.preventDefault();
    if (!novelForm.title.trim() || !novelForm.synopsis.trim()) {
      error('Title and synopsis are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const creatorName = user?.username || 'Author Unknown';
      const created = await novelStore.createNovel(novelForm, creatorName);
      success(`Novel "${created.title}" published!`);
      setShowCreateModal(false);
      loadCreatorNovels();
    } catch (err) {
      error(`Failed to publish: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNovelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNovel) return;
    if (!novelForm.title.trim() || !novelForm.synopsis.trim()) {
      error('Title and synopsis are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await novelStore.updateNovel(selectedNovel.id, novelForm);
      success(`Novel "${novelForm.title}" updated!`);
      setShowEditModal(false);
      setSelectedNovel(null);
      loadCreatorNovels();
    } catch (err) {
      error(`Failed to update novel: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNovelSubmit = async () => {
    if (!selectedNovel) return;

    setIsSubmitting(true);
    try {
      await novelStore.deleteNovel(selectedNovel.id);
      success(`Novel "${selectedNovel.title}" deleted.`);
      setShowDeleteModal(false);
      setSelectedNovel(null);
      loadCreatorNovels();
    } catch (err) {
      error(`Failed to delete novel: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userRolesList = Array.isArray(user?.roles) ? user.roles : (user?.roleType ? [user.roleType] : ['READER']);
  const maskedToken = token
    ? `${token.substring(0, 14)}••••••••••••••••••••••••••••••••${token.substring(token.length - 10)}`
    : 'No active session token';

  return (
    <div className="profile-page-wrapper">
      {/* 1. PROFESSIONAL HERO BANNER */}
      <section className="profile-hero">
        <div className="profile-hero-cover" />

        <div className="profile-hero-body">
          <div className="profile-hero-top">
            <div className="profile-avatar-cluster">
              <div className="profile-avatar-pro">
                {(user?.username || 'U').charAt(0).toUpperCase()}
                <span className="profile-status-indicator" title="Active Online Session" />
              </div>

              <div>
                <h1 className="profile-identity-title">{user?.username || 'Novelist'}</h1>
                <p className="profile-identity-handle">@{user?.username?.toLowerCase() || 'reader'}</p>

                <div className="profile-badges-row">
                  {isCreator ? (
                    <span className="pro-badge pro-badge-creator">
                      ★ Creator & Author
                    </span>
                  ) : (
                    <span className="pro-badge pro-badge-reader">
                      Reader
                    </span>
                  )}
                  <span className="pro-badge pro-badge-status">
                    ● {user?.accountStatus || 'Active'}
                  </span>
                  {user?.emailVerified && (
                    <span className="pro-badge pro-badge-verified">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-hero-actions">
              {isCreator ? (
                <button onClick={handleOpenCreateNovel} className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
                  <span>+</span> Publish Novel
                </button>
              ) : (
                <button
                  onClick={handleBecomeCreator}
                  disabled={convertLoading}
                  className="btn-primary"
                  style={{
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.9rem',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: 'none',
                  }}
                >
                  {convertLoading ? 'Activating...' : '✨ Become an Author'}
                </button>
              )}

              <button onClick={handleLogout} className="action-btn-secondary" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', color: 'var(--danger)' }}>
                Sign Out
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="profile-hero-stats">
            <div className="hero-stat-item">
              <span className="hero-stat-value">{creatorNovels.length}</span>
              <span className="hero-stat-label">Publications</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-value">18.4 hrs</span>
              <span className="hero-stat-label">Reading Time</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-value">12</span>
              <span className="hero-stat-label">Bookmarks</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-value" style={{ color: '#10b981' }}>TLS Encrypted</span>
              <span className="hero-stat-label">Session Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MODERN HORIZONTAL TABS */}
      <nav className="profile-tabs-header" aria-label="Profile Sections">
        <button
          className={`profile-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Account Overview</span>
        </button>

        <button
          className={`profile-tab-item ${activeTab === 'creator' ? 'active' : ''}`}
          onClick={() => setActiveTab('creator')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span>Creator Studio</span>
          {creatorNovels.length > 0 && (
            <span className="tab-counter-badge">{creatorNovels.length}</span>
          )}
        </button>

        <button
          className={`profile-tab-item ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>Reading Library</span>
        </button>

        <button
          className={`profile-tab-item ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Security & Sessions</span>
        </button>
      </nav>

      {/* 3. TAB VIEWS */}
      <div className="profile-tab-view">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {/* Creator Invitation Card (for Readers) */}
            {!isCreator ? (
              <div
                className="pro-card"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)',
                  border: '1.5px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <div className="pro-card-header">
                  <div>
                    <h3 className="pro-card-title" style={{ color: '#f59e0b' }}>
                      <span>✍️</span> Unlock Author Privileges on NovelForge
                    </h3>
                    <p className="pro-card-subtitle">
                      Publish original serials, write synopses, and build an audience. Conversion is instant with zero friction.
                    </p>
                  </div>
                  <button
                    onClick={handleBecomeCreator}
                    disabled={convertLoading}
                    className="btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      border: 'none',
                      padding: '0.65rem 1.4rem',
                    }}
                  >
                    {convertLoading ? 'Activating Creator...' : '⚡ Convert to Creator Account'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="pro-card"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(59, 130, 246, 0.04) 100%)',
                  border: '1.5px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <div className="pro-card-header">
                  <div>
                    <h3 className="pro-card-title" style={{ color: '#10b981' }}>
                      <span>👑</span> Active Creator Account
                    </h3>
                    <p className="pro-card-subtitle">
                      You are authorized to publish and manage serial novels. Access your full author workbench in the Creator Studio.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setActiveTab('creator')}
                      className="btn-primary"
                      style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
                    >
                      Open Creator Studio →
                    </button>
                    <button
                      onClick={handleOpenCreateNovel}
                      className="action-btn-secondary"
                      style={{ padding: '0.55rem 1rem', fontSize: '0.88rem' }}
                    >
                      + Publish Novel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Information Grid */}
            <div className="pro-card">
              <div className="pro-card-header">
                <div>
                  <h3 className="pro-card-title">
                    <span>👤</span> Personal & Account Details
                  </h3>
                  <p className="pro-card-subtitle">Essential details associated with your NovelForge account</p>
                </div>
              </div>

              <div className="pro-info-grid">
                <div className="pro-info-box">
                  <div className="pro-info-label">Account Identifier</div>
                  <div className="pro-info-value">#{user?.id || '—'}</div>
                </div>

                <div className="pro-info-box">
                  <div className="pro-info-label">Username</div>
                  <div className="pro-info-value">{user?.username || '—'}</div>
                </div>

                <div className="pro-info-box">
                  <div className="pro-info-label">Email Address</div>
                  <div className="pro-info-value">{user?.email || '—'}</div>
                </div>

                <div className="pro-info-box">
                  <div className="pro-info-label">Assigned Roles</div>
                  <div className="pro-info-value" style={{ color: isCreator ? '#f59e0b' : 'var(--primary)' }}>
                    {userRolesList.join(' • ')}
                  </div>
                </div>

                <div className="pro-info-box">
                  <div className="pro-info-label">Verification Status</div>
                  <div className="pro-info-value" style={{ color: user?.emailVerified ? '#10b981' : 'var(--text-secondary)' }}>
                    {user?.emailVerified ? 'Verified Account' : 'Standard Reader'}
                  </div>
                </div>

                <div className="pro-info-box">
                  <div className="pro-info-label">Account Health</div>
                  <div className="pro-info-value" style={{ color: '#10b981' }}>
                    {user?.accountStatus || 'ACTIVE'}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: CREATOR STUDIO */}
        {activeTab === 'creator' && (
          <div className="pro-card">
            <div className="pro-card-header">
              <div>
                <h3 className="pro-card-title">
                  <span>✨</span> Creator Studio & Catalog
                </h3>
                <p className="pro-card-subtitle">
                  Manage your serialized publications, story synopses, and publication status
                </p>
              </div>

              {isCreator ? (
                <button onClick={handleOpenCreateNovel} className="btn-primary" style={{ padding: '0.6rem 1.35rem' }}>
                  + Publish New Novel
                </button>
              ) : (
                <button
                  onClick={handleBecomeCreator}
                  disabled={convertLoading}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}
                >
                  {convertLoading ? 'Activating...' : 'Convert to Creator'}
                </button>
              )}
            </div>

            {/* Metrics Row */}
            <div className="studio-metrics-bar">
              <div className="studio-metric-card">
                <div className="studio-metric-icon">📚</div>
                <div className="studio-metric-info">
                  <span className="studio-metric-number">{creatorNovels.length}</span>
                  <span className="studio-metric-label">Published Serials</span>
                </div>
              </div>

              <div className="studio-metric-card">
                <div className="studio-metric-icon">👥</div>
                <div className="studio-metric-info">
                  <span className="studio-metric-number">14.2K</span>
                  <span className="studio-metric-label">Audience Reads</span>
                </div>
              </div>

              <div className="studio-metric-card">
                <div className="studio-metric-icon">⭐</div>
                <div className="studio-metric-info">
                  <span className="studio-metric-number">4.92</span>
                  <span className="studio-metric-label">Avg. Rating</span>
                </div>
              </div>

              <div className="studio-metric-card">
                <div className="studio-metric-icon">⚡</div>
                <div className="studio-metric-info">
                  <span className="studio-metric-number">{isCreator ? 'ACTIVE' : 'READY'}</span>
                  <span className="studio-metric-label">Author Status</span>
                </div>
              </div>
            </div>

            {/* Chapter status note */}
            <div className="chapter-alert-box" style={{ marginBottom: '1.5rem' }}>
              <strong>ℹ️ Chapter Authoring Pipeline:</strong> Novel CRUD (Title, Category, Synopsis) is fully operational.
              Polymorphic chapter blocks (`TextBlock`, `IllustrationBlock`) will link to your works upon backend merge.
            </div>

            {/* Publications List */}
            {novelsLoading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Loading your publications...
              </div>
            )}

            {!novelsLoading && creatorNovels.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                  {isCreator ? 'No novels published yet' : 'Become a Creator to start writing'}
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>
                  Publish your first serialized novel to start building your readership on NovelForge.
                </p>
                {isCreator ? (
                  <button onClick={handleOpenCreateNovel} className="btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
                    + Publish Your First Novel
                  </button>
                ) : (
                  <button onClick={handleBecomeCreator} disabled={convertLoading} className="btn-primary" style={{ background: '#f59e0b', border: 'none', padding: '0.6rem 1.4rem' }}>
                    {convertLoading ? 'Activating...' : 'Convert to Creator'}
                  </button>
                )}
              </div>
            )}

            {!novelsLoading && creatorNovels.length > 0 && (
              <div className="studio-novels-grid">
                {creatorNovels.map((novel) => (
                  <article key={novel.id} className="studio-novel-card">
                    <div className="studio-novel-header" style={{ background: novel.gradient || 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}>
                      <span className="pro-badge pro-badge-reader" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', alignSelf: 'flex-start' }}>
                        {novel.categoryType || 'FICTION'}
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                        {novel.title}
                      </span>
                    </div>

                    <div className="studio-novel-content">
                      <h4 className="studio-novel-title">{novel.title}</h4>
                      <p className="studio-novel-synopsis">{novel.synopsis}</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        <span>★ {novel.rating || '4.9'}</span>
                        <span>0 Chapters</span>
                        <span>{novel.views || '1.2K'} reads</span>
                      </div>

                      <div className="studio-novel-actions-bar">
                        <button
                          onClick={() => handleOpenEditNovel(novel)}
                          className="action-btn-secondary"
                          style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.85rem', justifyContent: 'center' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleOpenDeleteNovel(novel)}
                          className="action-btn-secondary"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', color: 'var(--danger)' }}
                          title="Delete Novel"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: READING LIBRARY */}
        {activeTab === 'library' && (
          <div className="pro-card">
            <div className="pro-card-header">
              <div>
                <h3 className="pro-card-title">
                  <span>📖</span> Reading Bookshelf & History
                </h3>
                <p className="pro-card-subtitle">Keep track of your active serials, bookmarks, and reading milestones</p>
              </div>
            </div>

            <div className="pro-info-grid">
              <div className="pro-info-box">
                <div className="pro-info-label">Saved Bookmarks</div>
                <div className="pro-info-value">12 Chapters Bookmarked</div>
              </div>
              <div className="pro-info-box">
                <div className="pro-info-label">Total Reading Time</div>
                <div className="pro-info-value">18.4 Hours</div>
              </div>
              <div className="pro-info-box">
                <div className="pro-info-label">Favorite Genres</div>
                <div className="pro-info-value">Epic Fantasy, LitRPG, Sci-Fi</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY & SESSIONS (PROFESSIONAL GRADE) */}
        {activeTab === 'security' && (
          <div className="pro-card">
            <div className="pro-card-header">
              <div>
                <h3 className="pro-card-title">
                  <span>🛡️</span> Security & Active Sessions
                </h3>
                <p className="pro-card-subtitle">
                  Enterprise-grade authentication, stateless tokens, and account safeguards
                </p>
              </div>
            </div>

            <div className="security-settings-list">
              {/* Account Credential */}
              <div className="security-setting-item">
                <div className="security-setting-info">
                  <h4 className="security-setting-title">Primary Account Email</h4>
                  <p className="security-setting-desc">{user?.email || 'reader@novelforge.com'}</p>
                </div>
                <span className="pro-badge pro-badge-verified">Verified</span>
              </div>

              {/* Password Status */}
              <div className="security-setting-item">
                <div className="security-setting-info">
                  <h4 className="security-setting-title">Account Password</h4>
                  <p className="security-setting-desc">Last changed via secure OTP verification</p>
                </div>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  ••••••••••••••••
                </span>
              </div>

              {/* Session Health */}
              <div className="security-setting-item">
                <div className="security-setting-info">
                  <h4 className="security-setting-title">Active Browser Session</h4>
                  <p className="security-setting-desc">
                    Protected with stateless JWT verification & auto-rotating HttpOnly cookie
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="security-session-pill">● Secure & Active</span>
                  <button
                    onClick={handleTestRefresh}
                    disabled={refreshLoading}
                    className="action-btn-secondary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                  >
                    {refreshLoading ? <span className="spinner-sm" /> : '↻'} Refresh Session
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Advanced Developer Tools */}
            <div className="dev-tools-accordion">
              <div
                className="dev-tools-header"
                onClick={() => setShowDevTools((prev) => !prev)}
              >
                <span>⚙️ Advanced: Developer Connectivity & Token Diagnostics</span>
                <span>{showDevTools ? '▲ Hide' : '▼ Expand'}</span>
              </div>

              {showDevTools && (
                <div className="dev-tools-body">
                  {/* Masked Token Box */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Session Access Token
                    </label>
                    <div className="masked-token-container">
                      <span className="masked-token-text">
                        {showFullToken ? (token ? `Bearer ${token}` : 'No active token') : maskedToken}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowFullToken((prev) => !prev)}
                        className="action-btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        {showFullToken ? 'Mask' : 'Reveal'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyToken}
                        className="action-btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        {tokenCopied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* API Endpoint Switcher */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      API Gateway Base URL
                    </label>
                    <form onSubmit={handleSaveApiUrl} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="form-input no-icon"
                        value={customApiUrl}
                        onChange={(e) => setCustomApiUrl(e.target.value)}
                        placeholder="https://api-gateway-g43i.onrender.com"
                        style={{ flex: 1, minWidth: '220px', padding: '0.5rem 0.75rem', fontSize: '0.88rem' }}
                      />
                      <button type="submit" className="action-btn-emerald" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        Save Endpoint
                      </button>
                      <button type="button" onClick={handleResetApiUrl} className="action-btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        Reset Default
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE NOVEL MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Publish New Novel</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateNovelSubmit}>
              <div className="modal-body">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Novel Title
                  </label>
                  <input
                    type="text"
                    required
                    value={novelForm.title}
                    onChange={(e) => setNovelForm({ ...novelForm, title: e.target.value })}
                    placeholder="e.g. Chronicles of the Void Sovereign"
                    className="form-input no-icon"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Category
                  </label>
                  <select
                    value={novelForm.categoryType}
                    onChange={(e) => setNovelForm({ ...novelForm, categoryType: e.target.value })}
                    className="form-input no-icon"
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <option value="FICTION">Fiction</option>
                    <option value="NONFICTION">Non-Fiction</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Synopsis
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={novelForm.synopsis}
                    onChange={(e) => setNovelForm({ ...novelForm, synopsis: e.target.value })}
                    placeholder="Provide a compelling story blurb and setting synopsis..."
                    className="form-input no-icon"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.4rem' }}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Novel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NOVEL MODAL */}
      {showEditModal && selectedNovel && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Novel Metadata</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateNovelSubmit}>
              <div className="modal-body">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Novel Title
                  </label>
                  <input
                    type="text"
                    required
                    value={novelForm.title}
                    onChange={(e) => setNovelForm({ ...novelForm, title: e.target.value })}
                    className="form-input no-icon"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Category
                  </label>
                  <select
                    value={novelForm.categoryType}
                    onChange={(e) => setNovelForm({ ...novelForm, categoryType: e.target.value })}
                    className="form-input no-icon"
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <option value="FICTION">Fiction</option>
                    <option value="NONFICTION">Non-Fiction</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Synopsis
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={novelForm.synopsis}
                    onChange={(e) => setNovelForm({ ...novelForm, synopsis: e.target.value })}
                    className="form-input no-icon"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="action-btn-emerald"
                  style={{ padding: '0.6rem 1.4rem' }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedNovel && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Confirm Deletion</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>"{selectedNovel.title}"</strong>?
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                This triggers a soft delete on the server with a 30-day retention grace period.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                style={{ padding: '0.55rem 1.2rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteNovelSubmit}
                disabled={isSubmitting}
                className="btn-primary"
                style={{ padding: '0.55rem 1.4rem', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Novel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
