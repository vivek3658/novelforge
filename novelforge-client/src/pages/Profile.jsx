import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi, studioApi, engagementApi, novelApi } from '../services/api';
import NovelCard from '../components/NovelCard';
import ImageUploader from '../components/ImageUploader';
import { Button, Input, Textarea, Select, Avatar, EmptyState, Skeleton, Badge } from '../components/ui';

export default function Profile() {
  const { user, fetchMe, logout, isCreator, convertToCreator } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('novels');
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    profileImageName: user?.profileImageName || '',
    visibility: user?.visibility || 'PUBLIC',
  });

  const [savedNovels, setSavedNovels] = useState([]);
  const [authoredNovels, setAuthoredNovels] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Profile and User Data
  const loadProfileData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load current profile
      const profile = await authApi.getProfile().catch(() => null);
      if (profile) {
        setProfileForm({
          username: profile.username || user?.username || '',
          displayName: profile.displayName || '',
          bio: profile.bio || '',
          profileImageName: profile.profileImageName || '',
          visibility: profile.visibility || 'PUBLIC',
        });
      }

      // Load saved novels with resolved novel metadata (NO raw IDs)
      try {
        const watchLater = await engagementApi.watchLater().catch(() => null);
        if (watchLater?.id) {
          const itemsRes = await engagementApi.collectionItems(watchLater.id, 0);
          const items = itemsRes?.content || [];
          const resolved = await Promise.all(
            items
              .filter((it) => it.targetType === 'NOVEL')
              .map(async (it) => {
                try {
                  return await novelApi.getNovelById(it.targetId);
                } catch {
                  return null;
                }
              })
          );
          setSavedNovels(resolved.filter(Boolean));
        }
      } catch {
        setSavedNovels([]);
      }

      // Load user's studio authored novels
      try {
        const studios = await studioApi.mine().catch(() => []);
        if (studios?.length) {
          const novelList = [];
          for (const studio of studios) {
            try {
              const res = await studioApi.listNovels(studio.id, 0);
              if (res?.content) novelList.push(...res.content);
            } catch {
              // Ignore single studio novel listing failure
            }
          }
          setAuthoredNovels(novelList);
        }
      } catch {
        setAuthoredNovels([]);
      }

      // Load user community posts
      try {
        const postsRes = await engagementApi.posts(0).catch(() => null);
        const allPosts = postsRes?.content || postsRes?.posts || [];
        const myUserId = String(user?.id || user?.userId || '');
        const myPosts = allPosts.filter(
          (p) => String(p.createdByUserId) === myUserId || String(p.authorId) === myUserId
        );
        setUserPosts(myPosts);
      } catch {
        setUserPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Update Profile Settings
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updatedProfile = await authApi.updateProfile(profileForm);
      if (updatedProfile?.username && updatedProfile.username !== user?.username) {
        success('Username changed. Please sign in again with your new username.');
        await logout();
        return;
      }
      await fetchMe();
      success('Profile updated successfully!');
    } catch (err) {
      toastError(err.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  // Activate Creator Status
  const handleActivateCreator = async () => {
    setSubmitting(true);
    try {
      await convertToCreator();
      await fetchMe();
      success('Creator profile activated! You can now launch your Studio.');
    } catch (err) {
      toastError(err.message || 'Failed to activate creator profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user?.displayName || user?.username || 'Reader';

  return (
    <div className="cr-home" style={{ paddingTop: '1.5rem' }}>
      <div className="ig-profile-page">
        {/* Profile Header */}
        <header className="ig-profile-header">
          <div className="ig-profile-avatar-wrap">
            <Avatar src={profileForm.profileImageName} name={displayName} alt={`${displayName} profile picture`} size="xl" />
          </div>

          <div className="ig-profile-details">
            <div className="ig-profile-row1">
              <h1 className="ig-profile-username">{user?.username || 'user'}</h1>
              <Badge variant={isCreator ? 'success' : 'neutral'}>
                {isCreator ? '★ Creator' : 'Reader'}
              </Badge>

              <div className="ig-profile-actions">
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('settings')}>
                  Edit Profile
                </Button>
                {isCreator ? (
                  <Link to="/studio" className="ui-btn ui-btn-primary ui-btn-sm">
                    Creator Studio
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleActivateCreator} loading={submitting}>
                    Become a Creator
                  </Button>
                )}
                <Button variant="quiet" size="sm" onClick={logout} style={{ color: 'var(--danger)' }}>
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Profile Statistics */}
            <div className="ig-stats-row">
              <div className="ig-stat">
                <strong>{authoredNovels.length}</strong>
                <span>novels</span>
              </div>
              <div className="ig-stat">
                <strong>{savedNovels.length}</strong>
                <span>saved</span>
              </div>
              <div className="ig-stat">
                <strong>{userPosts.length}</strong>
                <span>posts</span>
              </div>
            </div>

            {/* Bio & Metadata */}
            <div className="ig-profile-bio">
              <strong>{displayName}</strong>
              <p>{profileForm.bio || 'Exploring worlds one chapter at a time on NovelForge.'}</p>
              <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Account: <span style={{ color: 'var(--success)', fontWeight: 700 }}>● {user?.accountStatus || 'ACTIVE'}</span> • {user?.email}
              </div>
            </div>
          </div>
        </header>

        {/* Profile Navigation Tabs */}
        <nav className="ig-profile-tabs" aria-label="Profile navigation">
          <button
            type="button"
            className={`ig-tab-btn ${activeTab === 'novels' ? 'active' : ''}`}
            onClick={() => setActiveTab('novels')}
          >
            📚 Novels ({authoredNovels.length})
          </button>
          <button
            type="button"
            className={`ig-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            🔖 Saved ({savedNovels.length})
          </button>
          <button
            type="button"
            className={`ig-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            💬 Posts ({userPosts.length})
          </button>
          <button
            type="button"
            className={`ig-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        {/* Tab 1: Authored Novels */}
        {activeTab === 'novels' && (
          <div>
            {loading ? (
              <div className="story-grid home-book-shelf">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height="240px" borderRadius="14px" />
                ))}
              </div>
            ) : authoredNovels.length > 0 ? (
              <div className="story-grid home-book-shelf">
                {authoredNovels.map((novel) => (
                  <NovelCard key={novel.id} novel={novel} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="✍️"
                title="No authored novels yet"
                description="Launch your publishing channel in Creator Studio and serialize your first story."
                action={
                  <Link to="/studio" className="ui-btn ui-btn-primary">
                    Go to Creator Studio →
                  </Link>
                }
              />
            )}
          </div>
        )}

        {/* Tab 2: Saved Reading Shelf (NO raw IDs) */}
        {activeTab === 'saved' && (
          <div>
            {loading ? (
              <div className="story-grid home-book-shelf">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height="240px" borderRadius="14px" />
                ))}
              </div>
            ) : savedNovels.length > 0 ? (
              <div className="story-grid home-book-shelf">
                {savedNovels.map((novel) => (
                  <NovelCard key={novel.id} novel={novel} saved={true} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🔖"
                title="Your saved queue is empty"
                description="Bookmark your favorite novels from the catalog to read them later at your own pace."
                action={
                  <Link to="/novels" className="ui-btn ui-btn-primary">
                    Browse Catalog →
                  </Link>
                }
              />
            )}
          </div>
        )}

        {/* Tab 3: User Posts */}
        {activeTab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px', margin: '0 auto' }}>
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <article key={post.id} className="ig-post-card" style={{ padding: '1.25rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </p>
                  <small style={{ color: 'var(--text-muted)' }}>
                    Posted on {new Date(post.createdAt).toLocaleDateString()}
                  </small>
                </article>
              ))
            ) : (
              <EmptyState
                icon="💬"
                title="No community posts yet"
                description="Share updates, chapter sneak-peeks, and artwork with your readers in the Community."
                action={
                  <Link to="/community" className="ui-btn ui-btn-primary">
                    Go to Community Feed →
                  </Link>
                }
              />
            )}
          </div>
        )}

        {/* Tab 4: Settings */}
        {activeTab === 'settings' && (
          <div
            style={{
              maxWidth: '620px',
              margin: '0 auto',
              background: 'var(--bg-surface)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
            }}
          >
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem' }}>Profile & Account Settings</h2>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <ImageUploader
                value={profileForm.profileImageName}
                onChange={(profileImageName) => setProfileForm((current) => ({ ...current, profileImageName }))}
                label="Profile picture"
                hint="Upload a square JPG, PNG, or WebP image up to 5MB."
                aspectRatio="1 / 1"
              />

              <Input
                label="Username"
                minLength={3}
                maxLength={30}
                autoComplete="username"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                required
              />

              <Input
                label="Display Name"
                maxLength={50}
                value={profileForm.displayName}
                onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                required
              />

              <Textarea
                label="Bio"
                maxLength={500}
                rows={4}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              />

              <Select
                label="Profile Visibility"
                value={profileForm.visibility}
                onChange={(e) => setProfileForm({ ...profileForm, visibility: e.target.value })}
              >
                <option value="PUBLIC">Public (Visible to everyone)</option>
                <option value="PRIVATE">Private (Only followers)</option>
              </Select>

              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
              >
                Save Changes
              </Button>
            </form>

            {!isCreator && (
              <div
                style={{
                  marginTop: '2.5rem',
                  padding: '1.5rem',
                  background: 'var(--primary-light)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem', color: 'var(--primary)' }}>
                  Become a Verified Creator
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Upgrade your account to create Studios, collaborate with teams, and serialize original novels.
                </p>
                <Button variant="primary" onClick={handleActivateCreator} loading={submitting}>
                  Activate Creator Profile Now
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
