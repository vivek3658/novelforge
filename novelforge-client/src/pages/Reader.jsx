import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { novelApi, chaptersApi, engagementApi } from '../services/api';

export default function Reader() {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();

  const [novel, setNovel] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [chaptersList, setChaptersList] = useState([]);
  const [errMsg, setErrMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Reader Settings
  const [readingTheme, setReadingTheme] = useState(() => localStorage.getItem('nf_reader_theme') || 'sepia');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('nf_reader_font_size')) || 18);
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('nf_reader_font_family') || 'serif');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [pageWidth, setPageWidth] = useState(0);
  const pagesViewportRef = useRef(null);
  const touchStartX = useRef(null);

  // Chapter Comments & Engagement
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const chapterTargetId = `${novelId}:${chapterId}`;

  useEffect(() => {
    localStorage.setItem('nf_reader_theme', readingTheme);
  }, [readingTheme]);

  useEffect(() => {
    localStorage.setItem('nf_reader_font_size', String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('nf_reader_font_family', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrMsg('');

    Promise.all([
      novelApi.getNovelById(novelId),
      chaptersApi.getPublic(novelId, chapterId),
      chaptersApi.listPublic(novelId, 0, 100),
    ])
      .then(([novelRes, chapterRes, listRes]) => {
        if (!active) return;
        setNovel(novelRes);
        setChapter(chapterRes);
        setChaptersList(listRes?.content || []);
      })
      .catch((err) => {
        if (!active) return;
        setErrMsg(err.message || 'This chapter could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [novelId, chapterId]);

  // Load Chapter Comments
  const loadComments = async () => {
    if (!chapterId) return;
    try {
      const res = await engagementApi.comments('CHAPTER', chapterTargetId, 0);
      setComments(res?.content || []);
    } catch {
      // quiet fail
    }
  };

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      loadComments();
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      error('Please sign in to join the chapter discussion.');
      return;
    }
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await engagementApi.addComment('CHAPTER', chapterId, commentText.trim());
      setCommentText('');
      success('Comment posted!');
      loadComments();
    } catch (err) {
      error(err.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      error('Sign in to like this chapter.');
      return;
    }
    try {
      if (liked) {
        await engagementApi.unlike('CHAPTER', chapterTargetId);
        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await engagementApi.like('CHAPTER', chapterTargetId);
        setLiked(true);
        setLikesCount((prev) => prev + 1);
        success('Chapter liked!');
      }
    } catch (err) {
      error(err.message || 'Unable to update like.');
    }
  };

  const currentIndex = chapter ? chaptersList.findIndex((c) => c.id === chapter.id) : -1;
  const prevChapter = currentIndex > 0 ? chaptersList[currentIndex - 1] : undefined;
  const nextChapter = currentIndex >= 0 ? chaptersList[currentIndex + 1] : undefined;
  const blocks = [...(chapter?.blocks || [])].sort((a, b) => (a.position || 0) - (b.position || 0));

  const turnPage = useCallback((direction) => {
    const targetPage = pageIndex + direction;
    if (targetPage >= 0 && targetPage < pageCount) {
      setPageIndex(targetPage);
    } else if (direction > 0 && nextChapter) {
      navigate(`/novels/${novelId}/read/${nextChapter.id}`);
    } else if (direction < 0 && prevChapter) {
      navigate(`/novels/${novelId}/read/${prevChapter.id}`);
    }
  }, [pageIndex, pageCount, nextChapter, prevChapter, navigate, novelId]);

  useEffect(() => {
    setPageIndex(0);
    setPageCount(1);
  }, [novelId, chapterId]);

  useEffect(() => {
    const viewport = pagesViewportRef.current;
    if (!viewport) return undefined;

    const measurePages = () => {
      const width = viewport.clientWidth || 1;
      viewport.style.setProperty('--reader-page-width', `${width}px`);
      const nextPageCount = Math.max(1, Math.ceil(viewport.scrollWidth / width));
      setPageWidth(width);
      setPageCount(nextPageCount);
      setPageIndex((currentPage) => Math.min(currentPage, nextPageCount - 1));
    };

    const resizeObserver = new ResizeObserver(measurePages);
    resizeObserver.observe(viewport);
    window.addEventListener('resize', measurePages);
    const images = [...viewport.querySelectorAll('img')];
    images.forEach((image) => image.addEventListener('load', measurePages));
    const animationFrame = requestAnimationFrame(measurePages);
    document.fonts?.ready.then(measurePages);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measurePages);
      images.forEach((image) => image.removeEventListener('load', measurePages));
      cancelAnimationFrame(animationFrame);
    };
  }, [chapter?.blocks, chapterId, fontSize, fontFamily]);

  useEffect(() => {
    const handleChapterKeys = (event) => {
      const target = event.target;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName))) return;

      const nextPageKeys = ['ArrowRight', 'PageDown', ' ', 'AudioVolumeDown'];
      const previousPageKeys = ['ArrowLeft', 'PageUp', 'Backspace', 'AudioVolumeUp'];
      const isVolumeDown = event.key === 'AudioVolumeDown' || event.code === 'AudioVolumeDown';
      const isVolumeUp = event.key === 'AudioVolumeUp' || event.code === 'AudioVolumeUp';
      const direction = nextPageKeys.includes(event.key) || isVolumeDown ? 1
        : previousPageKeys.includes(event.key) || isVolumeUp ? -1
          : 0;
      if (direction) {
        event.preventDefault();
        turnPage(direction);
      }
    };
    window.addEventListener('keydown', handleChapterKeys);
    return () => window.removeEventListener('keydown', handleChapterKeys);
  }, [turnPage]);

  if (loading) {
    return (
      <div className="loading-row" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" /> Opening chapter…
      </div>
    );
  }

  if (errMsg || !chapter) {
    return (
      <section className="reader-page" style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="error-banner" style={{ marginBottom: '1.5rem' }}>{errMsg || 'Chapter not found.'}</div>
        <Link to={`/novels/${novelId}`} className="text-link">
          ← Back to novel overview
        </Link>
      </section>
    );
  }

  const wordCount = blocks.reduce((total, block) => total + (block.text?.trim().split(/\s+/).filter(Boolean).length || 0), 0);
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));

  return (
    <div className={`reader-viewport reader-theme-${readingTheme}`}>
      <article className="reader-page reader-book">
        {/* Top Sticky Navigation Toolbar */}
        <div className="reader-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Link to={`/novels/${novelId}`} className="back-link" style={{ fontWeight: 600 }}>
            ← {novel?.title || 'Back to Novel'}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Quick Chapter Selector Dropdown */}
            {chaptersList.length > 0 && (
              <select
                value={chapter.id}
                onChange={(e) => navigate(`/novels/${novelId}/read/${e.target.value}`)}
                className="reader-select-dropdown"
                style={{
                  background: 'var(--input-bg, #1e293b)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.85rem',
                }}
              >
                {chaptersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    Ch. {c.chapterNumber}: {c.title}
                  </option>
                ))}
              </select>
            )}

            {/* Reading Theme Toggle */}
            <div className="reader-theme-toggles" style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`reader-mode-btn ${readingTheme === 'dark' ? 'active' : ''}`}
                onClick={() => setReadingTheme('dark')}
                title="Dark mode"
                style={{ padding: '0.3rem 0.55rem', background: readingTheme === 'dark' ? '#0f172a' : '#1e293b', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                🌙
              </button>
              <button
                type="button"
                className={`reader-mode-btn ${readingTheme === 'sepia' ? 'active' : ''}`}
                onClick={() => setReadingTheme('sepia')}
                title="Warm Paper/Sepia mode"
                style={{ padding: '0.3rem 0.55rem', background: readingTheme === 'sepia' ? '#f4ecd8' : '#e6dcbe', color: '#5c4b37', border: 'none', cursor: 'pointer' }}
              >
                📜
              </button>
              <button
                type="button"
                className={`reader-mode-btn ${readingTheme === 'light' ? 'active' : ''}`}
                onClick={() => setReadingTheme('light')}
                title="Light mode"
                style={{ padding: '0.3rem 0.55rem', background: readingTheme === 'light' ? '#ffffff' : '#e2e8f0', color: '#000', border: 'none', cursor: 'pointer' }}
              >
                ☀️
              </button>
            </div>

            {/* Font Size Adjusters */}
            <div style={{ display: 'inline-flex', gap: '0.2rem' }}>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                title="Decrease font size"
                className="cr-btn-secondary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                title="Increase font size"
                className="cr-btn-secondary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontFamily((f) => (f === 'serif' ? 'sans' : 'serif'))}
                title="Toggle Serif / Sans font"
                className="cr-btn-secondary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
              >
                {fontFamily === 'serif' ? 'Serif' : 'Sans'}
              </button>
            </div>
          </div>
        </div>

        {/* Public chapter identity and reading metadata */}
        <header className="reader-chapter-heading">
          <div className="reader-series-row">
            <Link to={`/novels/${novelId}`} className="reader-series-cover" aria-label={`Open ${novel?.title || 'novel'} details`}>
              {novel?.coverImageUrl ? <img src={novel.coverImageUrl} alt="" /> : <span>{(novel?.title || 'N').slice(0, 1)}</span>}
            </Link>
            <div className="reader-series-meta">
              <small>NOW READING</small>
              <strong>{novel?.title || 'Novel'}</strong>
            </div>
            <Link to={`/novels/${novelId}`} className="reader-series-link">Novel details</Link>
          </div>
          <p className="reader-chapter-meta">
            Chapter {chapter.chapterNumber} · {readTimeMinutes} min read{chapter.publishedAt ? ` · Published ${new Date(chapter.publishedAt).toLocaleDateString()}` : ''}
          </p>
          <h1>{chapter.title}</h1>
        </header>

        {/* Sequential Blocks Body */}
        <div
          className="reader-pages-viewport"
          onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null) return;
            const distance = touchStartX.current - event.changedTouches[0].clientX;
            if (Math.abs(distance) > 48) turnPage(distance > 0 ? 1 : -1);
            touchStartX.current = null;
          }}
          aria-label="Chapter pages"
          tabIndex={0}
        >
          <div
            className="reader-content"
            ref={pagesViewportRef}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1.8,
              fontFamily: fontFamily === 'serif' ? 'Georgia, Cambria, "Times New Roman", serif' : 'system-ui, -apple-system, sans-serif',
              '--reader-page-width': pageWidth ? `${pageWidth}px` : '100cqi',
              transform: `translateX(-${pageIndex * pageWidth}px)`,
            }}
          >
          {blocks.map((block, idx) => {
            // Illustration Block
            if (block.type === 'ILLUSTRATION') {
              return (
                <figure key={block.id || idx} className="reader-illustration-block" style={{ margin: '2.5rem 0', textAlign: 'center' }}>
                  <img
                    src={block.imageUrl}
                    alt={block.altText || block.caption || `Illustration for chapter ${chapter.chapterNumber}`}
                    loading="lazy"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '75vh',
                      borderRadius: '8px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                  {block.caption && (
                    <figcaption
                      style={{
                        marginTop: '0.75rem',
                        fontSize: '0.88rem',
                        fontStyle: 'italic',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }

            // Quote / Callout Block (if prefixed with > or contains quote formatting)
            const isQuote = block.text?.startsWith('>') || block.type === 'QUOTE';
            if (isQuote) {
              const cleanText = block.text?.replace(/^>\s*/, '');
              return (
                <blockquote
                  key={block.id || idx}
                  className="reader-quote-block"
                  style={{
                    margin: '2rem 0',
                    padding: '1.25rem 1.5rem',
                    borderLeft: '4px solid #f47521',
                    background: 'rgba(244, 117, 33, 0.05)',
                    borderRadius: '0 8px 8px 0',
                    fontStyle: 'italic',
                  }}
                >
                  <p style={{ margin: 0 }}>"{cleanText}"</p>
                  {block.caption && (
                    <cite style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', notItalic: 'true' }}>
                      — {block.caption}
                    </cite>
                  )}
                </blockquote>
              );
            }

            // Standard Prose Text Paragraph Block
            return (
              <p
                key={block.id || idx}
                className="reader-text-paragraph"
                style={{
                  marginBottom: '1.5rem',
                  textIndent: '1.5rem',
                  letterSpacing: '0.01em',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {block.text}
              </p>
            );
          })}

            {blocks.length === 0 && (
              <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center', margin: '3rem 0' }}>
                This chapter has no published content blocks yet.
              </p>
            )}
          </div>
        </div>

        <nav className="reader-page-turner" aria-label="Page navigation">
          <button type="button" className="cr-btn-secondary" onClick={() => turnPage(-1)} disabled={pageIndex === 0 && !prevChapter} aria-label="Previous page">
            Previous
          </button>
          <div className="reader-page-progress" aria-live="polite">
            <span>Page {pageIndex + 1} of {pageCount}</span>
            <progress value={pageIndex + 1} max={pageCount} aria-label="Reading progress" />
            <small>← / → or swipe</small>
          </div>
          <button type="button" className="cr-btn-secondary" onClick={() => turnPage(1)} aria-label={pageIndex === pageCount - 1 && nextChapter ? 'Next chapter' : 'Next page'}>
            {pageIndex === pageCount - 1 && nextChapter ? 'Next chapter' : 'Next'}
          </button>
        </nav>

        {/* Reader Footer Actions (Like, Discussion, Pagination) */}
        <div className="reader-footer-actions" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className={`cr-btn-secondary ${liked ? 'liked' : ''}`}
                onClick={handleToggleLike}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: liked ? '#ef4444' : undefined }}
              >
                {liked ? '❤️' : '🤍'} {likesCount > 0 ? `${likesCount} Likes` : 'Like Chapter'}
              </button>
              <button
                type="button"
                className="cr-btn-secondary"
                onClick={handleToggleComments}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                💬 {showComments ? 'Hide Comments' : `Discussion (${comments.length})`}
              </button>
            </div>

            <Link to={`/novels/${novelId}`} className="text-link" style={{ fontSize: '0.9rem' }}>
              📖 Table of Contents
            </Link>
          </div>

          {/* Chapter Comments Section */}
          {showComments && (
            <section className="reader-comments-drawer" style={{ background: 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem' }}>
                Chapter Discussion ({comments.length})
              </h3>

              {isAuthenticated ? (
                <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    placeholder="Share your thoughts on this chapter…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="ig-comment-input"
                    style={{ flex: 1 }}
                    maxLength={1000}
                    required
                  />
                  <button type="submit" className="cr-btn-primary" disabled={submittingComment || !commentText.trim()}>
                    {submittingComment ? 'Posting…' : 'Comment'}
                  </button>
                </form>
              ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  <Link to="/login" className="text-link">Sign in</Link> to leave a comment on this chapter.
                </div>
              )}

              <div style={{ display: 'grid', gap: '0.85rem' }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                      <strong style={{ color: 'var(--primary)' }}>Reader</strong>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{c.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '1rem' }}>
                    No comments on this chapter yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Previous / Next Chapter Pagination */}
          <nav className="reader-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            {prevChapter ? (
              <Link className="cr-btn-secondary" to={`/novels/${novelId}/read/${prevChapter.id}`} style={{ padding: '0.75rem 1.25rem' }}>
                ← Previous Chapter
              </Link>
            ) : (
              <span />
            )}
            {nextChapter ? (
              <Link className="cr-btn-primary" to={`/novels/${novelId}/read/${nextChapter.id}`} style={{ padding: '0.75rem 1.25rem' }}>
                Next Chapter →
              </Link>
            ) : (
              <Link className="cr-btn-secondary" to={`/novels/${novelId}`} style={{ padding: '0.75rem 1.25rem' }}>
                Finish Novel ✦
              </Link>
            )}
          </nav>
        </div>
      </article>
    </div>
  );
}
