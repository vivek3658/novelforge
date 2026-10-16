import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { novelStore, getLocalAuthorDrafts } from '../services/novelStore';
import StudioManager from '../components/StudioManager';
import './Profile.css';
import './Home.css';

const Profile = () => {
  const {
    user,
    profile,
    isCreator,
    isPendingDeletion,
    accountStatus,
    logout,
    refreshSession,
    activateCreator,
    deactivateCreator,
    updateProfile,
    requestAccountDeletion,
    cancelAccountDeletion,
  } = useAuth();

  const { success, error, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab navigation
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Loading states
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [creatorActionLoading, setCreatorActionLoading] = useState(false);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Author drafts & catalog
  const [authorDrafts, setAuthorDrafts] = useState([]);
  const [savedBookmarks, setSavedBookmarks] = useState([]);

  // Modals state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    bio: '',
    visibility: 'PUBLIC',
  });

  // Draft Form State
  const [draftForm, setDraftForm] = useState({
    title: '',
    categoryType: 'FICTION',
    genre: 'Fantasy / Adventure',
    synopsis: '',
  });

  // Load author drafts & bookmarks
  const refreshAuthorData = useCallback(() => {
    setAuthorDrafts(getLocalAuthorDrafts());
    try {
      const bmarks = JSON.parse(localStorage.getItem('novelforge_bookmarks') || '[]');
      setSavedBookmarks(bmarks);
    } catch {
      setSavedBookmarks([]);
    }
  }, []);

  useEffect(() => {
    refreshAuthorData();
  }, [refreshAuthorData]);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab && ['overview', 'creator', 'studios', 'library', 'security'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Seed profile form on profile update
  useEffect(() => {
    if (profile) {
      setProfileForm({
        displayName: profile.displayName || user?.username || '',
        bio: profile.bio || '',
        visibility: profile.visibility || 'PUBLIC',
      });
    }
  }, [profile, user]);

  // Handle Creator activation (real POST /api/v1/identity/profile/creator)
  const handleActivateCreator = async () => {
    setCreatorActionLoading(true);
    try {
      await activateCreator();
      success('🎉 Author privileges unlocked! Welcome to the Creator Studio.');
      setActiveTab('creator');
    } catch (err) {
      error(err.message || 'Failed to activate Creator account.');
    } finally {
      setCreatorActionLoading(false);
    }
  };

  // Handle Creator deactivation (real POST /api/v1/identity/profile/creator/deactivate)
  const handleDeactivateCreator = async () => {
    setCreatorActionLoading(true);
    try {
      await deactivateCreator();
      info('Creator status set to deactivated.');
    } catch (err) {
      error(err.message || 'Failed to deactivate Creator account.');
    } finally {
      setCreatorActionLoading(false);
    }
  };

  // Handle Profile Update (real PATCH /api/v1/identity/profile/me)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile(profileForm);
      success('Profile updated successfully!');
      setShowEditProfileModal(false);
    } catch (err) {
      error(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Account Deletion Request (real DELETE /api/v1/identity/account)
  const handleRequestDeletion = async () => {
    setAccountActionLoading(true);
    try {
      await requestAccountDeletion();
      success('Account deletion requested. Your account is now in a 30-day grace period.');
      setShowDeleteAccountModal(false);
    } catch (err) {
      error(err.message || 'Failed to request account deletion.');
    } finally {
      setAccountActionLoading(false);
    }
  };

  // Handle Account Deletion Cancellation (real POST /api/v1/identity/account/cancel-deletion)
  const handleCancelDeletion = async () => {
    setAccountActionLoading(true);
    try {
      await cancelAccountDeletion();
      success('Account deletion cancelled! Your account is active.');
    } catch (err) {
      error(err.message || 'Failed to cancel deletion.');
    } finally {
      setAccountActionLoading(false);
    }
  };

  // Test token refresh via backend HttpOnly cookie
  const handleTestRefresh = async () => {
    setRefreshLoading(true);
    try {
      const result = await refreshSession();
      if (result) {
        success('Session token refreshed successfully via HttpOnly refresh cookie.');
      } else {
        info('Session is active. Refresh verified.');
      }
    } catch (err) {
      error(err.message || 'Session refresh cycle failed.');
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    success('Signed out successfully.');
    navigate('/login');
  };

  // Draft Management Handlers
  const handleOpenNewDraft = () => {
    setSelectedDraft(null);
    setDraftForm({
      title: '',
      categoryType: 'FICTION',
      genre: 'Original Fiction',
      synopsis: '',
    });
    setShowDraftModal(true);
  };

  const handleOpenEditDraft = (draft) => {
    setSelectedDraft(draft);
    setDraftForm({
      title: draft.title || '',
      categoryType: draft.categoryType || 'FICTION',
      genre: draft.genre || 'Original Fiction',
      synopsis: draft.synopsis || '',
    });
    setShowDraftModal(true);
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!draftForm.title.trim()) {
      error('Draft title is required.');
      return;
    }

    try {
      const authorName = user?.username || 'Author';
      const saved = await novelStore.saveDraft(
        {
          ...(selectedDraft || {}),
          ...draftForm,
        },
        authorName
      );
      success(`Draft "${saved.title}" saved in local author workspace.`);
      setShowDraftModal(false);
      refreshAuthorData();
    } catch (err) {
      error(err.message || 'Failed to save draft.');
    }
  };

  const handleDeleteDraft = async (draftId) => {
    try {
      await novelStore.deleteDraft(draftId);
      success('Draft removed from local workspace.');
      refreshAuthorData();
    } catch (err) {
      error(err.message || 'Failed to delete draft.');
    }
  };

  const handleAttemptPublish = () => {
    info(
      'Publishing API Status: Backend NovelController endpoints are currently pending deployment to the API Gateway. Local simulation has been intentionally disabled to maintain production integrity. Your work is safe as a local draft.'
    );
  };

  const userRolesList = Array.isArray(user?.roles) ? user.roles : ['USER'];

  return (
    <div className="profile-page-wrapper">
      {/* PENDING DELETION CRITICAL BANNER */}
      {isPendingDeletion && (
        <aside
          role="alert"
          style={{
            background: 'var(--danger-light)',
            border: '2px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--danger)', margin: '0 0 0.25rem 0' }}>
              ⚠️ Account Scheduled for Deletion
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--danger)' }}>
              Your account has a pending deletion request and will be purged in 30 days. You can cancel this request at any time.
            </p>
          </div>
          <button
            onClick={handleCancelDeletion}
            disabled={accountActionLoading}
            className="btn-primary"
            style={{
              backgroundColor: 'var(--danger)',
              borderColor: 'var(--danger)',
              padding: '0.55rem 1.25rem',
            }}
          >
            {accountActionLoading ? 'Restoring...' : 'Cancel Deletion Request'}
          </button>
        </aside>
      )}

      {/* HERO BANNER */}
      <section className="profile-hero">
        <div className="profile-hero-cover" />

        <div className="profile-hero-body">
          <div className="profile-hero-top">
            <div className="profile-avatar-cluster">
              <div className="profile-avatar-pro" aria-label="User avatar">
                {(user?.username || 'U').charAt(0).toUpperCase()}
                <span className="profile-status-indicator" title="Active Session" />
              </div>

              <div>
                <h1 className="profile-identity-title">
                  {profile?.displayName || user?.username || 'Author'}
                </h1>
                <p className="profile-identity-handle">@{user?.username?.toLowerCase() || 'reader'}</p>

                <div className="profile-badges-row">
                  {isCreator ? (
                    <span className="pro-badge pro-badge-creator">
                      ★ Active Creator
                    </span>
                  ) : (
                    <span className="pro-badge pro-badge-reader">
                      Reader
                    </span>
                  )}
                  <span className="pro-badge pro-badge-status">
                    ● {accountStatus}
                  </span>
                  {user?.emailVerified && (
                    <span className="pro-badge pro-badge-verified">
                      ✓ Verified Email
                    </span>
                  )}
                  {profile?.visibility && (
                    <span className="pro-badge" style={{ background: 'var(--bg-surface-elevated)' }}>
                      {profile.visibility} Profile
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-hero-actions">
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="action-btn-secondary"
                style={{ padding: '0.6rem 1.1rem', fontSize: '0.9rem' }}
              >
                ✏️ Edit Profile
              </button>

              {isCreator ? (
                <button
                  onClick={handleOpenNewDraft}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
                >
                  <span>+</span> New Novel Draft
                </button>
              ) : (
                <button
                  onClick={handleActivateCreator}
                  disabled={creatorActionLoading}
                  className="btn-primary"
                  style={{
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.9rem',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: 'none',
                  }}
                >
                  {creatorActionLoading ? 'Activating...' : '✨ Become an Author'}
                </button>
              )}

              <button
                onClick={handleLogout}
                className="action-btn-secondary"
                style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', color: 'var(--danger)' }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="profile-hero-stats">
            <div className="hero-stat-item">
              <span className="hero-stat-value">{authorDrafts.length}</span>
              <span className="hero-stat-label">Local Drafts</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-value">{savedBookmarks.length}</span>
              <span className="hero-stat-label">Saved Bookmarks</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-value" style={{ color: isCreator ? '#f59e0b' : 'var(--primary)' }}>
                {profile?.creatorStatus || 'NONE'}
              </span>
              <span className="hero-stat-label">Creator Status</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-value" style={{ color: 'var(--primary)' }}>
                Secure JWT
              </span>
              <span className="hero-stat-label">Session State</span>
            </div>
          </div>
        </div>
      </section>

      {/* HORIZONTAL NAVIGATION TABS */}
      <nav className="profile-tabs-header" aria-label="Profile workspace sections">
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
          {authorDrafts.length > 0 && (
            <span className="tab-counter-badge">{authorDrafts.length}</span>
          )}
        </button>

        <button
          className={`profile-tab-item ${activeTab === 'studios' ? 'active' : ''}`}
          onClick={() => setActiveTab('studios')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Studio Teams</span>
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
          {savedBookmarks.length > 0 && (
            <span className="tab-counter-badge">{savedBookmarks.length}</span>
          )}
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

      {/* TAB CONTENT VIEWS */}
      <div className="profile-tab-view">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {/* Creator Invitation Card */}
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
                      Elevate your account to create serial works, write story blurb synopses, and build an audience. Activated directly via the Identity microservice.
                    </p>
                  </div>
                  <button
                    onClick={handleActivateCreator}
                    disabled={creatorActionLoading}
                    className="btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      border: 'none',
                      padding: '0.65rem 1.4rem',
                    }}
                  >
                    {creatorActionLoading ? 'Activating...' : '⚡ Activate Creator Account'}
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
                    <h3 className="pro-card-title" style={{ color: 'var(--primary)' }}>
                      <span>👑</span> Active Creator Status
                    </h3>
                    <p className="pro-card-subtitle">
                      Your author privileges are live on the Identity microservice. Access your author workbench in the Creator Studio.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setActiveTab('creator')}
                      className="btn-primary"
                      style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
                    >
                      Open Creator Studio →
                    </button>
                    <button
                      onClick={handleDeactivateCreator}
                      disabled={creatorActionLoading}
                      className="action-btn-secondary"
                      style={{ padding: '0.55rem 1rem', fontSize: '0.88rem' }}
                    >
                      {creatorActionLoading ? 'Updating...' : 'Deactivate Creator'}
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
                    <span>👤</span> Personal & Identity Profile
                  </h3>
                  <p className="pro-card-subtitle">
                    Confirmed data synced directly from Identity Service (`/api/v1/identity/profile/me` & `/auth/me`)
                  </p>
                </div>
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="action-btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Edit Profile
                </button>
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
                  <div className="pro-info-label">Display Name</div>
                  <div className="pro-info-value">{profile?.displayName || user?.username || '—'}</div>
                </div>

                <div className="pro-info-box">
                  <div className="pro-info-label">Email Address</div>
                  <div className="pro-info-value">{user?.email || '—'}</div>
                </div>

                <div className="pro-info-box">
                  <div className="pro-info-label">Assigned Roles</div>
                  <div className="pro-info-value" style={{ color: 'var(--primary)' }}>
                    {userRolesList.join(', ')}
                  </div>
                </div>

                <div className="pro-info-box">
                  <div className="pro-info-label">Account Health</div>
                  <div
                    className="pro-info-value"
                    style={{ color: isPendingDeletion ? 'var(--danger)' : 'var(--primary)' }}
                  >
                    {accountStatus}
                  </div>
                </div>
              </div>

              {profile?.bio && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                  <div className="pro-info-label" style={{ marginBottom: '0.5rem' }}>Author Bio</div>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: CREATOR STUDIO */}
        {activeTab === 'creator' && (
          <div className="pro-card">
            <div className="pro-card-header">
              <div>
                <h3 className="pro-card-title">
                  <span>✨</span> Creator Studio & Draft Workspace
                </h3>
                <p className="pro-card-subtitle">
                  Compose, organize, and prepare your original serialized works
                </p>
              </div>

              {isCreator ? (
                <button onClick={handleOpenNewDraft} className="btn-primary" style={{ padding: '0.6rem 1.35rem' }}>
                  + New Novel Draft
                </button>
              ) : (
                <button
                  onClick={handleActivateCreator}
                  disabled={creatorActionLoading}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}
                >
                  {creatorActionLoading ? 'Activating...' : 'Activate Creator'}
                </button>
              )}
            </div>

            {/* Transparent Backend API Status Alert */}
            <aside
              role="status"
              className="chapter-alert-box"
              style={{
                background: 'var(--bg-surface-elevated)',
                borderLeft: '4px solid #f59e0b',
                marginBottom: '1.75rem',
              }}
            >
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                ℹ️ Novel Service API Contract Status: In Development
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                The backend `NovelController` class is an empty stub and has not yet exposed live CRUD endpoints (`GET/POST /novels`) through the API Gateway.
                In accordance with NovelForge integrity policies, publishing to server is marked as pending. Your novel synopses and metadata are stored safely in your local author draft workspace below.
              </p>
            </aside>

            {/* Drafts List */}
            {authorDrafts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3.5rem 1rem',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-color)',
                }}
              >
                <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                  No novel drafts in progress
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>
                  Start a new draft to prepare your novel title, category, and story blurb.
                </p>
                <button onClick={handleOpenNewDraft} className="btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
                  + Create Your First Draft
                </button>
              </div>
            ) : (
              <div className="studio-novels-grid">
                {authorDrafts.map((draft) => (
                  <article key={draft.id} className="studio-novel-card">
                    <div className="studio-novel-header" style={{ background: draft.gradient }}>
                      <span className="pro-badge pro-badge-reader" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none' }}>
                        Local Draft
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                        {draft.title}
                      </span>
                    </div>

                    <div className="studio-novel-content">
                      <h4 className="studio-novel-title">{draft.title}</h4>
                      <p className="studio-novel-synopsis">{draft.synopsis || 'No synopsis added yet.'}</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        <span>Category: {draft.categoryType || 'FICTION'}</span>
                        <span>Saved Locally</span>
                      </div>

                      <div className="studio-novel-actions-bar">
                        <button
                          onClick={() => handleOpenEditDraft(draft)}
                          className="action-btn-secondary"
                          style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.85rem', justifyContent: 'center' }}
                        >
                          ✏️ Edit Draft
                        </button>
                        <button
                          onClick={handleAttemptPublish}
                          className="btn-primary"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                          title="Publish to live server"
                        >
                          🚀 Publish
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="action-btn-secondary"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', color: 'var(--danger)' }}
                          title="Delete Draft"
                          aria-label="Delete draft"
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

        {/* TAB 3: STUDIO TEAMS */}
        {activeTab === 'studios' && (
          <div className="pro-card">
            <StudioManager
              isCreator={isCreator}
              onActivateCreator={handleActivateCreator}
            />
          </div>
        )}

        {/* TAB 4: READING LIBRARY */}
        {activeTab === 'library' && (
          <div className="pro-card">
            <div className="pro-card-header">
              <div>
                <h3 className="pro-card-title">
                  <span>📖</span> Reading Bookshelf & Saved Bookmarks
                </h3>
                <p className="pro-card-subtitle">Your saved serials and bookmarked chapters</p>
              </div>
              <Link to="/novels" className="btn-primary" style={{ padding: '0.55rem 1.2rem', fontSize: '0.88rem' }}>
                Browse Catalog
              </Link>
            </div>

            {savedBookmarks.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                  You have not saved any novels to your library yet.
                </p>
                <Link to="/novels" className="btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
                  Explore Curated Novels
                </Link>
              </div>
            ) : (
              <div className="pro-info-grid">
                <div className="pro-info-box">
                  <div className="pro-info-label">Active Bookmarks</div>
                  <div className="pro-info-value">{savedBookmarks.length} Novels Bookmarked</div>
                </div>
                <div className="pro-info-box">
                  <div className="pro-info-label">Reading Mode</div>
                  <div className="pro-info-value">Distraction-Free Sepia / Dark</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SECURITY & SESSIONS */}
        {activeTab === 'security' && (
          <div className="pro-card">
            <div className="pro-card-header">
              <div>
                <h3 className="pro-card-title">
                  <span>🛡️</span> Security, Identity & Lifecycle
                </h3>
                <p className="pro-card-subtitle">
                  Stateless JWT authorization, HttpOnly refresh cookies, and account deletion lifecycle
                </p>
              </div>
            </div>

            <div className="security-settings-list">
              {/* Account Email */}
              <div className="security-setting-item">
                <div className="security-setting-info">
                  <h4 className="security-setting-title">Primary Identity Email</h4>
                  <p className="security-setting-desc">{user?.email || 'user@novelforge.com'}</p>
                </div>
                <span className="pro-badge pro-badge-verified">
                  {user?.emailVerified ? '✓ Verified' : 'Standard'}
                </span>
              </div>

              {/* Session State */}
              <div className="security-setting-item">
                <div className="security-setting-info">
                  <h4 className="security-setting-title">Browser Session & Tokens</h4>
                  <p className="security-setting-desc">
                    Access token is held in client memory; refresh token is isolated in browser HttpOnly cookie
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="security-session-pill">● Protected Session</span>
                  <button
                    onClick={handleTestRefresh}
                    disabled={refreshLoading}
                    className="action-btn-secondary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                  >
                    {refreshLoading ? 'Refreshing...' : '↻ Test Cookie Refresh'}
                  </button>
                </div>
              </div>

              {/* Account Deletion Lifecycle */}
              <div className="security-setting-item" style={{ borderBottom: 'none' }}>
                <div className="security-setting-info">
                  <h4 className="security-setting-title" style={{ color: isPendingDeletion ? 'var(--danger)' : 'inherit' }}>
                    Account Retention & Deletion
                  </h4>
                  <p className="security-setting-desc">
                    NovelForge provides a 30-day retention grace period for requested account deletions.
                  </p>
                </div>

                {isPendingDeletion ? (
                  <button
                    onClick={handleCancelDeletion}
                    disabled={accountActionLoading}
                    className="btn-primary"
                    style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    {accountActionLoading ? 'Restoring...' : 'Cancel Deletion Request'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDeleteAccountModal(true)}
                    className="action-btn-secondary"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    Request Deletion
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditProfileModal && (
        <div className="modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Public Profile</h2>
              <button className="modal-close-btn" onClick={() => setShowEditProfileModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    className="form-input no-icon"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Profile Visibility
                  </label>
                  <select
                    value={profileForm.visibility}
                    onChange={(e) => setProfileForm({ ...profileForm, visibility: e.target.value })}
                    className="form-input no-icon"
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <option value="PUBLIC">Public (Visible to readers)</option>
                    <option value="PRIVATE">Private (Only visible to you)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Author Bio
                  </label>
                  <textarea
                    rows={4}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell readers about your stories, inspirations, and publishing schedule..."
                    className="form-input no-icon"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div className="chapter-alert-box" style={{ fontSize: '0.82rem' }}>
                  ℹ️ Avatar image uploads require backend signature integration. Initials and account identifiers are displayed.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.4rem' }}
                >
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAFT MODAL */}
      {showDraftModal && (
        <div className="modal-overlay" onClick={() => setShowDraftModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedDraft ? 'Edit Novel Draft' : 'Create New Novel Draft'}
              </h2>
              <button className="modal-close-btn" onClick={() => setShowDraftModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveDraft}>
              <div className="modal-body">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Novel Title
                  </label>
                  <input
                    type="text"
                    required
                    value={draftForm.title}
                    onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })}
                    placeholder="e.g. Chronicles of the Starforge"
                    className="form-input no-icon"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Category
                  </label>
                  <select
                    value={draftForm.categoryType}
                    onChange={(e) => setDraftForm({ ...draftForm, categoryType: e.target.value })}
                    className="form-input no-icon"
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <option value="FICTION">Fiction</option>
                    <option value="NONFICTION">Non-Fiction</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Genre
                  </label>
                  <input
                    type="text"
                    value={draftForm.genre}
                    onChange={(e) => setDraftForm({ ...draftForm, genre: e.target.value })}
                    placeholder="e.g. High Fantasy / Cultivation"
                    className="form-input no-icon"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Synopsis & Story Blurb
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={draftForm.synopsis}
                    onChange={(e) => setDraftForm({ ...draftForm, synopsis: e.target.value })}
                    placeholder="Write a compelling blurb for prospective readers..."
                    className="form-input no-icon"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div className="chapter-alert-box" style={{ fontSize: '0.82rem' }}>
                  ℹ️ Saved safely in your local author drafts workspace.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.4rem' }}
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteAccountModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteAccountModal(false)}>
          <div className="modal-container" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Request Account Deletion</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteAccountModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Are you sure you want to request deletion of your account (<strong>{user?.username}</strong>)?
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Your account will be placed into a 30-day pending deletion state. You can cancel this request at any time during this period.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="btn-secondary"
                style={{ padding: '0.55rem 1.2rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestDeletion}
                disabled={accountActionLoading}
                className="btn-primary"
                style={{ padding: '0.55rem 1.4rem', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                {accountActionLoading ? 'Requesting...' : 'Confirm Deletion Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
