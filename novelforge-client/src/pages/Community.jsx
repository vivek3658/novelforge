import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { engagementApi, studioApi } from '../services/api';
import PostCard from '../components/PostCard';
import ImageUploader from '../components/ImageUploader';
import { Button, EmptyState } from '../components/ui';

export default function Community() {
  const { user, isAuthenticated, isCreator, convertToCreator, fetchMe } = useAuth();
  const { success, error } = useToast();

  const [posts, setPosts] = useState([]);
  const [studios, setStudios] = useState([]);
  const [selectedStudioAuthor, setSelectedStudioAuthor] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [activeFeed, setActiveFeed] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activatingCreator, setActivatingCreator] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadPosts = useCallback(async (pageToLoad = 0, append = false) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await engagementApi.posts(pageToLoad);
      const list = res?.content || res?.posts || [];
      setPosts((prev) => (append ? [...prev, ...list] : list));
      setHasMore(!res?.last);
      setPage(pageToLoad);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to load community posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(0);
  }, [loadPosts]);

  useEffect(() => {
    if (isAuthenticated) {
      studioApi
        .mine()
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.content || res?.posts || [];
          setStudios(list);
        })
        .catch(() => setStudios([]));
    }
  }, [isAuthenticated]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const matchedStudio = studios.find((s) => s.id === selectedStudioAuthor);
    const authorType = matchedStudio ? 'STUDIO' : 'CREATOR';
    const authorId = matchedStudio?.id || user?.id || user?.userId || '1';

    setSubmitting(true);
    try {
      await engagementApi.createPost({
        authorType,
        authorId: String(authorId),
        content: content.trim(),
        imageUrl: mediaUrl.trim() || null,
        tags: tags
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean),
      });

      setContent('');
      setMediaUrl('');
      setTags('');
      setIsComposerOpen(false);
      success('Your post is live on the community feed!');
      await loadPosts(0);
    } catch (err) {
      error(err.message || 'Could not publish update.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateCreator = async () => {
    setActivatingCreator(true);
    try {
      await convertToCreator();
      await fetchMe();
      success('Creator profile activated! You can now publish updates to the community.');
    } catch (err) {
      error(err.message || 'Could not activate creator profile.');
    } finally {
      setActivatingCreator(false);
    }
  };

  const submitOnShortcut = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const visiblePosts = activeFeed === 'all' ? posts : posts.filter((post) => post.authorType === activeFeed);

  return (
    <div className="cr-home community-page">
      {/* 1. Instagram-Style Stories / Active Creator Bubbles */}
      <header className="community-hero">
        <div><p className="eyebrow">THE READER & CREATOR LOUNGE</p><h1>Stories start conversations.</h1><p>Meet the people behind your favorite worlds, share a first look, or join the discussion.</p></div>
        {isAuthenticated && <button type="button" className="cr-btn-primary" onClick={() => { setIsComposerOpen(true); document.querySelector('.ig-composer-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>＋ Write a post</button>}
      </header>
      <section className="ig-stories-section" style={{ marginBottom: '1.5rem' }}>
        <div
          className="ig-stories-scroll"
          style={{
            display: 'flex',
            gap: '1.25rem',
            overflowX: 'auto',
            padding: '0.5rem 0.25rem',
            scrollbarWidth: 'none',
          }}
        >
          {/* User's story bubble */}
          <div style={{ textAlign: 'center', minWidth: '72px', cursor: 'pointer' }} onClick={() => setIsComposerOpen(true)}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                padding: '2px',
                background: 'linear-gradient(45deg, #f47521, #ec4899)',
                margin: '0 auto',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: '#0b0f19',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  color: '#fff',
                }}
              >
                ＋
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', marginTop: '0.35rem', display: 'block', color: 'var(--text-muted)' }}>
              New Post
            </span>
          </div>

          {/* Studios / Channels bubbles */}
          {studios.map((st) => (
            <div key={st.id} style={{ textAlign: 'center', minWidth: '72px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  padding: '2px',
                  background: 'linear-gradient(45deg, #f47521, #38bdf8)',
                  margin: '0 auto',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: '#1e293b',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: '#fff',
                  }}
                >
                  {(st.studioName || 'S').slice(0, 1).toUpperCase()}
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  marginTop: '0.35rem',
                  display: 'block',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '72px',
                }}
              >
                {st.studioName}
              </span>
            </div>
          ))}

          {/* Empty channel guidance */}
          {studios.length === 0 && (
            <p className="community-channel-empty">Follow a studio to see its updates here.</p>
          )}
        </div>
      </section>

      {/* 2. Community Post Composer */}
      <div className="ig-feed-container">
        {isAuthenticated && !isCreator && studios.length === 0 ? (
          <div
            className="ig-composer-card"
            style={{
              marginBottom: '1.5rem',
              padding: '1.5rem',
              background: 'var(--primary-light)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
            }}
          >
            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--primary)', fontSize: '1.1rem' }}>
              Want to share stories and updates with readers?
            </h3>
            <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Publishing community updates is available to verified creators and publishing studios. Activate your free creator profile in one click to post announcements, scene excerpts, and artwork.
            </p>
            <Button variant="primary" size="sm" loading={activatingCreator} onClick={handleActivateCreator}>
              Activate Creator Profile Now
            </Button>
          </div>
        ) : isAuthenticated ? (
          <div className="ig-composer-card" style={{ marginBottom: '1.5rem', borderRadius: '12px', background: 'var(--bg-surface)', padding: '1.25rem' }}>
            <div className="ig-composer-header" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div
                className="ig-composer-avatar"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                {(user?.displayName || user?.username || 'U').slice(0, 1).toUpperCase()}
              </div>
              <input
                className="ig-composer-input"
                placeholder="What's on your mind? Share art, updates, or teasers…"
                value={content}
                onFocus={() => setIsComposerOpen(true)}
                onChange={(e) => setContent(e.target.value)}
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '24px' }}
              />
            </div>

            {isComposerOpen && (
              <form onSubmit={handleCreatePost} className="ig-composer-expanded" style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
                <textarea
                  className="ig-composer-textarea"
                  rows={5}
                  maxLength={3000}
                  placeholder="Write your update, announcement, or scene excerpt…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={submitOnShortcut}
                  aria-label="Write a community post"
                  required
                />
                <p className="composer-shortcut-hint">Tip: press Ctrl/⌘ + Enter to publish</p>

                {/* Post As Switcher */}
                {studios.length > 0 && (
                  <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    Post As:
                    <select
                      className="ig-comment-input"
                      value={selectedStudioAuthor}
                      onChange={(e) => setSelectedStudioAuthor(e.target.value)}
                    >
                      <option value="">Personal Creator Profile (@{user?.username})</option>
                      {studios.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.studioName} (Studio Channel)
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Direct Image Upload */}
                <ImageUploader
                  value={mediaUrl}
                  onChange={setMediaUrl}
                  label="Attach Illustration or Media"
                  hint="PNG, JPG, WEBP or GIF up to 5MB"
                />

                <input
                  type="text"
                  className="ig-comment-input"
                  placeholder="Tags (Comma separated, e.g. fantasy, art, ch12)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />

                <div className="ig-composer-controls" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button variant="quiet" onClick={() => setIsComposerOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={submitting} disabled={!content.trim()}>
                    Share to Community
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="ig-composer-card" style={{ textAlign: 'center', padding: '1.75rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--text-secondary)' }}>
              Join the conversation with authors and readers worldwide.
            </p>
            <Link to="/login" className="ui-btn ui-btn-primary" style={{ display: 'inline-block' }}>
              Sign In to Post Updates
            </Link>
          </div>
        )}

        {errorMsg && <div className="error-banner">{errorMsg}</div>}

        {/* 3. Community Post Cards List */}
        <nav className="community-feed-tabs" aria-label="Filter community posts">
          {[['all', 'For you'], ['STUDIO', 'Studios'], ['CREATOR', 'Creators']].map(([key, label]) => (
            <button key={key} type="button" className={activeFeed === key ? 'active' : ''} onClick={() => setActiveFeed(key)}>{label}</button>
          ))}
        </nav>
        <div className="ig-posts-list" style={{ display: 'grid', gap: '1.5rem' }}>
          {visiblePosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {visiblePosts.length === 0 && !loading && (
          <div className="cr-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {posts.length ? 'Nothing in this feed yet. Try another tab to discover more.' : 'No community posts yet. Be the first to share an update with readers!'}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              type="button"
              className="cr-btn-secondary"
              onClick={() => loadPosts(page + 1, true)}
              disabled={loading}
              style={{ padding: '0.75rem 2rem' }}
            >
              {loading ? 'Loading…' : 'Load More Updates'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
