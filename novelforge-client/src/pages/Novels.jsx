import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { novelStore } from '../services/novelStore';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Novels = () => {
  const { isAuthenticated, isCreator } = useAuth();
  const navigate = useNavigate();

  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState('grid');
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Fetch novels from store
  const fetchNovels = useCallback(async (query = '') => {
    setLoading(true);
    try {
      let result;
      if (query.trim().length > 0) {
        result = await novelStore.searchNovels(query.trim());
      } else {
        result = await novelStore.loadAllNovels();
      }
      setNovels(result.novels || []);
      setIsLiveConnected(Boolean(result.isLiveBackendAvailable));
    } catch (err) {
      console.warn('Failed to load novels:', err.message);
      setIsLiveConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNovels(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, fetchNovels]);

  // Filter & Sort novels
  const processedNovels = novels
    .filter((n) => {
      if (categoryFilter === 'ALL') return true;
      return (n.categoryType || 'FICTION').toUpperCase() === categoryFilter.toUpperCase();
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

  return (
    <div className="app-container" style={{ padding: '3rem 1.5rem 5rem 1.5rem' }}>
      {/* Header Section */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h1 className="section-title" style={{ margin: 0 }}>📚 Novel Directory</h1>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                fontWeight: 700,
                backgroundColor: isLiveConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: isLiveConnected ? '#10b981' : '#818cf8',
                border: `1px solid ${isLiveConnected ? '#10b981' : '#818cf8'}`,
              }}
            >
              {isLiveConnected ? '● Live Backend Service' : '○ Curated Catalog Showcase'}
            </span>
          </div>
          <p className="section-subtitle">
            Explore serial web fiction, read chapters, and discover community authors
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            isCreator ? (
              <button
                onClick={() => navigate('/profile?tab=creator')}
                className="btn-primary"
                style={{ padding: '0.65rem 1.35rem', fontSize: '0.92rem' }}
              >
                + Open Creator Studio
              </button>
            ) : (
              <button
                onClick={() => navigate('/profile')}
                className="btn-primary"
                style={{
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.92rem',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none',
                }}
              >
                ✨ Become an Author
              </button>
            )
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{ padding: '0.65rem 1.35rem', fontSize: '0.92rem' }}
            >
              Sign In to Write
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1', minWidth: '260px', maxWidth: '440px' }}>
          <input
            type="text"
            placeholder="Search by title, author, genre, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input no-icon"
            style={{ width: '100%' }}
            aria-label="Search novels"
          />
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {['ALL', 'FICTION', 'NONFICTION'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: categoryFilter === cat ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: categoryFilter === cat ? 'var(--primary-light)' : 'var(--bg-surface)',
                color: categoryFilter === cat ? 'var(--primary)' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              {cat === 'ALL' ? 'All Works' : cat === 'FICTION' ? 'Fiction' : 'Non-Fiction'}
            </button>
          ))}

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input no-icon"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
            aria-label="Sort novels"
          >
            <option value="rating">Top Rated</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>

          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="action-btn-secondary"
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? '☰ List' : '☵ Grid'}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
          <div className="spinner-sm" style={{ margin: '0 auto 1rem auto', width: '28px', height: '28px' }} />
          <p>Syncing novel catalog...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && processedNovels.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
          }}
        >
          <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No novels found
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {search ? `No novels match query "${search}". Try another keyword.` : 'No novels in this category.'}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Novels Grid / List */}
      {!loading && processedNovels.length > 0 && (
        <div className={viewMode === 'grid' ? 'novels-grid' : 'novels-list-view'}>
          {processedNovels.map((novel) => (
            <article
              key={novel.id}
              className="novel-card"
              onClick={() => navigate(`/novels/${novel.id}`)}
              style={{ cursor: 'pointer' }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/novels/${novel.id}`);
                }
              }}
              aria-label={`View novel ${novel.title} by ${novel.author || 'Author Unknown'}`}
            >
              <div
                className="novel-cover-placeholder"
                style={{ background: novel.gradient || 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}
              >
                <span className="novel-badge-tag">{novel.categoryType || 'FICTION'}</span>
                <span style={{ fontSize: '1.2rem', letterSpacing: '-0.5px' }}>{novel.title}</span>
              </div>

              <div className="novel-info">
                <h2 className="novel-title" style={{ fontSize: '1.15rem', margin: '0 0 0.35rem 0' }}>
                  {novel.title}
                </h2>
                <div className="novel-author">by {novel.author || 'Author Unknown'}</div>
                <p className="novel-synopsis">{novel.synopsis}</p>

                <div className="novel-stats">
                  <span className="novel-rating">★ {novel.rating || '4.9'}</span>
                  <span>{novel.chapters?.length || 0} Chs</span>
                  <span>{novel.views || '1.2K'} reads</span>
                </div>

                <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                    Read Story →
                  </span>
                  {novel.isDraft && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--warning)',
                        background: 'var(--warning-light)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                      }}
                    >
                      Local Draft
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Novels;
