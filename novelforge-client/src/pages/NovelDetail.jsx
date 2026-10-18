import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { novelStore } from '../services/novelStore';
import { useToast } from '../context/ToastContext';
import './NovelDetail.css';

const NovelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success } = useToast();

  const [novel, setNovel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadNovel = async () => {
      try {
        const data = await novelStore.getNovelById(id);
        if (isMounted) {
          setNovel(data);
          // Check local bookmark state
          try {
            const savedBookmarks = JSON.parse(localStorage.getItem('novelforge_bookmarks') || '[]');
            setIsBookmarked(savedBookmarks.includes(String(id)));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn('Failed to load novel:', err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNovel();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleToggleBookmark = () => {
    try {
      const savedBookmarks = JSON.parse(localStorage.getItem('novelforge_bookmarks') || '[]');
      let updated;
      if (isBookmarked) {
        updated = savedBookmarks.filter((b) => b !== String(id));
        setIsBookmarked(false);
        success('Removed from bookmarks');
      } else {
        updated = [...savedBookmarks, String(id)];
        setIsBookmarked(true);
        success('Added to your reading library bookmarks');
      }
      localStorage.setItem('novelforge_bookmarks', JSON.stringify(updated));
    } catch {
      setIsBookmarked(!isBookmarked);
    }
  };

  if (loading) {
    return (
      <div className="novel-detail-container" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Loading novel details...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Preparing story overview and chapter directory</p>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="novel-detail-container" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Novel Not Found
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 2rem auto' }}>
          The requested novel does not exist or may have been removed from the catalog.
        </p>
        <button
          onClick={() => navigate('/novels')}
          className="btn-read-now"
          style={{ display: 'inline-flex' }}
        >
          ← Browse Novel Catalog
        </button>
      </div>
    );
  }

  const chapters = Array.isArray(novel.chapters) ? novel.chapters : [];
  const firstChapterId = chapters.length > 0 ? (chapters[0].id || 1) : null;

  return (
    <div className="novel-detail-container">
      {/* Back to catalog navigation link */}
      <Link to="/novels" className="novel-detail-back-link">
        <span aria-hidden="true">←</span>
        <span>Back to Novel Catalog</span>
      </Link>

      {/* Hero Card */}
      <header className="novel-detail-hero">
        <div
          className="novel-cover-large"
          style={{ background: novel.gradient || 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}
        >
          <span className="novel-cover-large-badge">
            {novel.categoryType || 'FICTION'}
          </span>
          <span className="novel-cover-large-title">{novel.title}</span>
        </div>

        <div className="novel-detail-main">
          <h1 className="novel-detail-title">{novel.title}</h1>
          <div className="novel-detail-author">
            by <strong>{novel.author || 'Author Unknown'}</strong>
            {novel.isDraft && (
              <span
                style={{
                  marginLeft: '0.75rem',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: 'var(--warning-light)',
                  color: 'var(--warning)',
                  fontWeight: 700,
                  border: '1px solid var(--warning)',
                }}
              >
                Local Author Draft
              </span>
            )}
          </div>

          {Array.isArray(novel.tags) && novel.tags.length > 0 && (
            <div className="novel-tags-row">
              {novel.tags.map((tag, idx) => (
                <span key={idx} className="novel-tag-pill">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="novel-detail-stats">
            <div className="stat-item">
              <span className="stat-item-label">Rating</span>
              <span className="stat-item-value" style={{ color: 'var(--warning)' }}>
                ★ {novel.rating || '4.9'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">Chapters</span>
              <span className="stat-item-value">{chapters.length} Chs</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">Audience Reads</span>
              <span className="stat-item-value">{novel.views || '1.2K'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">Status</span>
              <span className="stat-item-value">
                {novel.isDraft ? 'In Progress Draft' : 'Serialized'}
              </span>
            </div>
          </div>

          <div className="novel-detail-actions">
            {firstChapterId ? (
              <Link
                to={`/read/${novel.id}/${firstChapterId}`}
                className="btn-read-now"
                aria-label={`Start reading ${novel.title} from Chapter 1`}
              >
                <span aria-hidden="true">📖</span>
                <span>Start Reading (Ch 1)</span>
              </Link>
            ) : (
              <button
                type="button"
                className="btn-read-now"
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                No Chapters Published Yet
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleBookmark}
              className="btn-bookmark-toggle"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark novel'}
            >
              <span>{isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Catalog Transparency Disclaimer */}
      {novel.isCuratedCatalog && (
        <aside className="catalog-disclaimer-box" aria-label="Catalog data information">
          <strong>ℹ️ Curated Catalog Showcase:</strong> This novel is part of the NovelForge
          demonstration catalog, designed to test reading typography, responsiveness, and chapter
          navigation. Real-time author publishing endpoints are undergoing backend gateway
          exposure.
        </aside>
      )}

      {novel.isDraft && (
        <aside
          className="catalog-disclaimer-box"
          style={{ borderLeftColor: 'var(--warning)' }}
          aria-label="Draft information"
        >
          <strong>📝 Author Draft:</strong> This work is saved in your local workspace. Backend
          publishing to the live server will unlock once the NovelController endpoints are
          deployed to the API Gateway.
        </aside>
      )}

      {/* Synopsis Section */}
      <section className="novel-detail-section" aria-labelledby="synopsis-heading">
        <h2 id="synopsis-heading" className="section-headline">
          <span>📜</span> Synopsis & Setting
        </h2>
        <div className="novel-synopsis-text">
          {novel.synopsis || 'No synopsis provided for this novel yet.'}
        </div>
      </section>

      {/* Chapter Directory Section */}
      <section className="novel-detail-section" aria-labelledby="chapters-heading">
        <div className="chapters-directory-header">
          <h2 id="chapters-heading" className="section-headline" style={{ margin: 0 }}>
            <span>📑</span> Table of Contents
          </h2>
          <span className="chapters-count-badge">
            {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
          </span>
        </div>

        {chapters.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            No chapters have been released for this novel yet.
          </div>
        ) : (
          <nav className="chapters-list" aria-label="Chapters index">
            {chapters.map((chap, idx) => (
              <Link
                key={chap.id || idx}
                to={`/read/${novel.id}/${chap.id || chap.chapterNumber}`}
                className="chapter-row-link"
              >
                <span className="chapter-row-title">
                  {chap.title || `Chapter ${chap.chapterNumber || idx + 1}`}
                </span>
                <span className="chapter-row-meta">
                  {chap.wordCount && <span>{chap.wordCount.toLocaleString()} words</span>}
                  <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </nav>
        )}
      </section>
    </div>
  );
};

export default NovelDetail;
