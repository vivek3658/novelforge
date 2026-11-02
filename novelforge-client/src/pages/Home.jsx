import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { novelApi, chaptersApi, engagementApi } from '../services/api';
import NovelCard from '../components/NovelCard';

const GENRES = ['All', 'Fantasy', 'Cyberpunk', 'Sci-Fi', 'Xianxia', 'Action', 'Romance', 'Drama'];

export default function Home() {
  const [novels, setNovels] = useState([]);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [communityPosts, setCommunityPosts] = useState([]);
  const [catalogQuery, setCatalogQuery] = useState('');

  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      novelApi.searchNovels('', 0, 24).catch(() => ({ content: [] })),
      engagementApi.posts(0).catch(() => ({ content: [] })),
    ])
      .then(([novelRes, postRes]) => {
        if (!active) return;
        setNovels(novelRes?.content || []);
        setCommunityPosts((postRes?.content || postRes?.posts || []).slice(0, 4));
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(err.message || 'Unable to load catalog.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const spotlightNovel = novels[spotlightIndex] || novels[0] || null;

  // Filter novels by selected genre
  const filteredNovels =
    selectedGenre === 'All'
      ? novels
      : novels.filter(
          (n) =>
            n.genres?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()) ||
            n.tags?.some((t) => t.toLowerCase() === selectedGenre.toLowerCase())
        );

  const handleSaveToLibrary = async (novelOrId) => {
    const novelId = typeof novelOrId === 'object' ? novelOrId.id : novelOrId;
    if (!isAuthenticated) {
      error('Sign in to add this novel to your library queue.');
      return;
    }
    try {
      await engagementApi.saveNovel(novelId);
      success('Added to your library queue!');
    } catch (err) {
      error(err.message || 'Unable to save to library.');
    }
  };

  const handleQuickRead = async (novelId) => {
    try {
      const chaptersRes = await chaptersApi.listPublic(novelId, 0, 1);
      if (chaptersRes?.content?.length > 0) {
        navigate(`/novels/${novelId}/read/${chaptersRes.content[0].id}`);
      } else {
        navigate(`/novels/${novelId}`);
      }
    } catch {
      navigate(`/novels/${novelId}`);
    }
  };

  return (
    <div className="cr-home">
      <form className="home-search home-catalog-search" role="search" onSubmit={(event) => { event.preventDefault(); navigate(`/novels${catalogQuery.trim() ? `?q=${encodeURIComponent(catalogQuery.trim())}` : ''}`); }}>
        <span aria-hidden="true">⌕</span>
        <input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Search novels, genres, or creators" aria-label="Search novels, genres, or creators" />
        <button type="submit">Search</button>
      </form>
      {/* 1. Crunchyroll Spotlight Hero Banner */}
      {spotlightNovel && (
        <section className="cr-spotlight" aria-label="Featured Spotlight">
          <div className="cr-spotlight-backdrop" />
          <div className="cr-spotlight-inner">
            <div className="cr-spotlight-content">
              <div className="cr-badge-row">
                <span className="cr-badge-orange">A NovelForge original</span>
                <span className="cr-badge-outline">{spotlightNovel.categoryType || 'FICTION'}</span>
                <span className="cr-badge-outline">Status: {spotlightNovel.publicationState || 'PUBLISHED'}</span>
              </div>
              <h1 className="cr-spotlight-title">{spotlightNovel.title}</h1>
              <div className="cr-spotlight-meta">
                <span>Serialized story</span>
                <span>•</span>
                <span>Read one chapter at a time</span>
              </div>
              <p className="cr-spotlight-synopsis">{spotlightNovel.synopsis || 'Explore an expansive world serialized by independent creators.'}</p>
              {spotlightNovel.genres?.length > 0 && (
                <div className="cr-badge-row" style={{ marginTop: '0.25rem' }}>
                  {spotlightNovel.genres.map((g) => (
                    <span key={g} className="cr-tag-pill" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
                      #{g}
                    </span>
                  ))}
                </div>
              )}
              <div className="cr-spotlight-actions">
                <button type="button" className="cr-btn-primary" onClick={() => handleQuickRead(spotlightNovel.id)}>
                  ▶ Start Reading Ch. 1
                </button>
                <button type="button" className="cr-btn-secondary" onClick={() => handleSaveToLibrary(spotlightNovel.id)}>
                  ＋ Add to Library
                </button>
                <Link to={`/novels/${spotlightNovel.id}`} className="cr-btn-secondary">
                  ℹ Novel Details
                </Link>
              </div>
            </div>

            {/* Spotlight Carousel Selector */}
            <div className="cr-spotlight-carousel">
              <span
                style={{
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 800,
                }}
              >
                Trending on NovelForge
              </span>
              {novels.slice(0, 4).map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  className={`cr-spotlight-thumb ${spotlightIndex === idx ? 'active' : ''}`}
                  onClick={() => setSpotlightIndex(idx)}
                >
                  <div className="cr-thumb-mark">{idx + 1}</div>
                  <div className="cr-thumb-info">
                    <strong>{item.title}</strong>
                    <span>
                      {item.categoryType} • {item.genres?.[0] || 'Fiction'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. Top 10 Popular UGC Novels Shelf (Crunchyroll Ranked Numbers Style) */}
      <section className="cr-section" style={{ marginTop: '2.5rem' }}>
        <div className="cr-section-header">
          <div className="cr-section-title">
            <span className="cr-accent-bar" />
            <h2>Find your next favorite</h2>
          </div>
          <Link to="/trending" className="cr-view-all">
            Browse all novels →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center', color: '#94a3b8' }}>
            <span className="spinner" /> Loading ranked UGC novels…
          </div>
        ) : errorMsg ? (
          <div className="error-banner">{errorMsg}</div>
        ) : (
          <div className="story-grid home-book-shelf">
            {novels.slice(0, 8).map((novel) => <NovelCard key={novel.id} novel={novel} />)}
          </div>
        )}
      </section>

      {/* 3. Explore by Genre Shelf with Interactive Filter Tabs */}
      <section className="cr-section" style={{ marginTop: '3.5rem' }}>
        <div className="cr-section-header">
          <div className="cr-section-title">
              <span className="cr-accent-bar" />
            <h2>Popular by Genre</h2>
          </div>
          <Link to="/categories" className="cr-view-all">
            All Genres & Shelves →
          </Link>
        </div>

        <div className="cr-genre-pills">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              className={`cr-pill ${selectedGenre === g ? 'active' : ''}`}
              onClick={() => setSelectedGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="story-grid home-book-shelf">
          {filteredNovels.slice(0, 8).map((novel) => <NovelCard key={novel.id} novel={novel} onSave={handleSaveToLibrary} />)}
          {filteredNovels.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No novels found for genre "{selectedGenre}". Try selecting "All" or exploring the catalog.
            </div>
          )}
        </div>
      </section>

      {/* 4. Live Creator Community Updates Strip (Instagram Style) */}
      {communityPosts.length > 0 && (
        <section className="cr-section" style={{ marginTop: '3.5rem' }}>
          <div className="cr-section-header">
            <div className="cr-section-title">
              <span className="cr-accent-bar" />
              <h2>Creator Feed & Studio Announcements</h2>
            </div>
            <Link to="/community" className="cr-view-all">
              Open Community Feed →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
            {communityPosts.map((post) => (
              <div
                key={post.id}
                className="cr-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, var(--primary), #79b888)',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                      }}
                    >
                      {post.authorType === 'STUDIO' ? 'S' : 'C'}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {post.authorType === 'STUDIO' ? 'Studio Broadcast' : 'Author Update'}
                        <span style={{ color: '#38bdf8', fontSize: '0.8rem' }}>●</span>
                      </strong>
                      <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
                      </small>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                    {post.content?.slice(0, 140)}
                    {post.content?.length > 140 ? '…' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>❤️ {post.likesCount || 0} likes</span>
                  <Link to="/community" className="text-link" style={{ fontSize: '0.8rem' }}>
                    Join discussion →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Creator Studio Callout Banner */}
      <section className="cr-section" style={{ marginTop: '4.5rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
            border: '1px solid rgba(244, 117, 33, 0.3)',
            borderRadius: '14px',
            padding: '2.5rem 3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div>
            <span
              className="cr-badge-orange"
              style={{
                marginBottom: '0.75rem',
                display: 'inline-block',
              }}
            >
              Creator Studio
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                margin: '0.3rem 0',
                fontWeight: 900,
                color: '#fff',
              }}
            >
              Broadcast your novels to readers worldwide.
            </h2>
            <p
              style={{
                color: '#94a3b8',
                margin: 0,
                maxWidth: '540px',
                fontSize: '0.95rem',
                lineHeight: 1.6,
              }}
            >
              Build your writing studio, arrange serialized chapters into sequential text and illustration blocks, and cultivate an audience on NovelForge.
            </p>
          </div>
          <Link
            to="/studio"
            className="cr-btn-primary"
            style={{
              padding: '0.9rem 1.8rem',
              fontSize: '1rem',
            }}
          >
            {user ? 'Open Studio Workspace →' : 'Launch Your Studio →'}
          </Link>
        </div>
      </section>
    </div>
  );
}
