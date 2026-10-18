import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { novelStore } from '../services/novelStore';
import './Reader.css';

const Reader = () => {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();

  const [novel, setNovel] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Reader Customization Preferences
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('novelforge_reader_fontsize') || '18', 10);
  });
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('novelforge_reader_fontfamily') || 'serif';
  });
  const [readerWidth, setReaderWidth] = useState(() => {
    return localStorage.getItem('novelforge_reader_width') || 'comfortable';
  });
  const [readerTheme, setReaderTheme] = useState(() => {
    return localStorage.getItem('novelforge_reader_theme') || 'sepia';
  });

  // Track reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(100);
        return;
      }
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save preferences to localStorage
  const updateFontSize = (delta) => {
    setFontSize((prev) => {
      const next = Math.max(14, Math.min(26, prev + delta));
      localStorage.setItem('novelforge_reader_fontsize', String(next));
      return next;
    });
  };

  const updateFontFamily = (family) => {
    setFontFamily(family);
    localStorage.setItem('novelforge_reader_fontfamily', family);
  };

  const updateReaderWidth = (width) => {
    setReaderWidth(width);
    localStorage.setItem('novelforge_reader_width', width);
  };

  const updateReaderTheme = (theme) => {
    setReaderTheme(theme);
    localStorage.setItem('novelforge_reader_theme', theme);
  };

  // Load chapter data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadChapter = async () => {
      try {
        const result = await novelStore.getChapter(novelId, chapterId);
        if (isMounted) {
          if (result) {
            setNovel(result.novel);
            setChapter(result.chapter);
            window.scrollTo({ top: 0, behavior: 'instant' });
          } else {
            setNovel(null);
            setChapter(null);
          }
        }
      } catch (err) {
        console.warn('Failed to load chapter:', err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChapter();

    return () => {
      isMounted = false;
    };
  }, [novelId, chapterId]);

  // Compute Prev & Next Chapters
  const allChapters = novel?.chapters || [];
  const currentIndex = allChapters.findIndex(
    (c) => String(c.id) === String(chapterId) || String(c.chapterNumber) === String(chapterId)
  );

  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  // Keyboard navigation (ArrowLeft = prev, ArrowRight = next)
  const handleKeyDown = useCallback(
    (e) => {
      // Ignore if user is inside a form element
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'ArrowLeft' && prevChapter) {
        navigate(`/read/${novelId}/${prevChapter.id || prevChapter.chapterNumber}`);
      } else if (e.key === 'ArrowRight' && nextChapter) {
        navigate(`/read/${novelId}/${nextChapter.id || nextChapter.chapterNumber}`);
      }
    },
    [navigate, novelId, prevChapter, nextChapter]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className={`reader-page-wrapper reader-theme-${readerTheme}`}>
        <div style={{ textAlign: 'center', padding: '8rem 1.5rem', color: 'var(--reader-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }} />
          <p>Loading chapter text and formatting typography...</p>
        </div>
      </div>
    );
  }

  if (!chapter || !novel) {
    return (
      <div className={`reader-page-wrapper reader-theme-${readerTheme}`}>
        <div style={{ textAlign: 'center', padding: '6rem 1.5rem', maxWidth: '520px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Chapter Not Found</h1>
          <p style={{ marginBottom: '2rem', color: 'var(--reader-muted)' }}>
            The requested chapter could not be located. It may have been relocated or is yet to be published.
          </p>
          <Link
            to={`/novels/${novelId}`}
            className="reader-nav-btn"
            style={{ display: 'inline-flex' }}
          >
            ← Return to Novel Overview
          </Link>
        </div>
      </div>
    );
  }

  const paragraphs = Array.isArray(chapter.paragraphs) ? chapter.paragraphs : [];

  return (
    <div className={`reader-page-wrapper reader-theme-${readerTheme}`}>
      {/* Scroll Progress Bar */}
      <div
        className="reader-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Reading progress"
      />

      {/* Reader Toolbar */}
      <header className="reader-toolbar">
        <div className="reader-toolbar-inner">
          <Link
            to={`/novels/${novelId}`}
            className="reader-nav-back"
            aria-label={`Exit reader and return to ${novel.title}`}
          >
            <span aria-hidden="true">←</span>
            <span>Table of Contents</span>
          </Link>

          <span className="reader-title-preview" title={chapter.title}>
            {chapter.title}
          </span>

          {/* Reading Controls Cluster */}
          <div className="reader-controls-cluster" role="toolbar" aria-label="Reading preferences">
            {/* Font Size */}
            <button
              className="reader-control-btn"
              onClick={() => updateFontSize(-1)}
              aria-label="Decrease font size"
              title="Decrease font size"
            >
              A-
            </button>
            <button
              className="reader-control-btn"
              onClick={() => updateFontSize(1)}
              aria-label="Increase font size"
              title="Increase font size"
            >
              A+
            </button>

            {/* Font Family */}
            <button
              className={`reader-control-btn ${fontFamily === 'serif' ? 'active' : ''}`}
              onClick={() => updateFontFamily('serif')}
              title="Serif font"
              aria-label="Use serif font"
            >
              Serif
            </button>
            <button
              className={`reader-control-btn ${fontFamily === 'sans' ? 'active' : ''}`}
              onClick={() => updateFontFamily('sans')}
              title="Sans-serif font"
              aria-label="Use sans-serif font"
            >
              Sans
            </button>

            {/* Reading Width */}
            <button
              className={`reader-control-btn ${readerWidth === 'comfortable' ? 'active' : ''}`}
              onClick={() =>
                updateReaderWidth(
                  readerWidth === 'narrow'
                    ? 'comfortable'
                    : readerWidth === 'comfortable'
                    ? 'wide'
                    : 'narrow'
                )
              }
              title={`Reading width: ${readerWidth}`}
              aria-label={`Cycle reading width (currently ${readerWidth})`}
            >
              ↔
            </button>

            {/* Reading Themes */}
            <button
              className={`reader-control-btn ${readerTheme === 'sepia' ? 'active' : ''}`}
              onClick={() => updateReaderTheme('sepia')}
              title="Sepia warm paper mode"
              aria-label="Sepia mode"
            >
              📜
            </button>
            <button
              className={`reader-control-btn ${readerTheme === 'dark' ? 'active' : ''}`}
              onClick={() => updateReaderTheme('dark')}
              title="Dark reading mode"
              aria-label="Dark mode"
            >
              🌙
            </button>
            <button
              className={`reader-control-btn ${readerTheme === 'light' ? 'active' : ''}`}
              onClick={() => updateReaderTheme('light')}
              title="Light reading mode"
              aria-label="Light mode"
            >
              ☀️
            </button>
          </div>
        </div>
      </header>

      {/* Main Chapter Content */}
      <main
        className={`reader-content-container reader-width-${readerWidth} reader-font-${fontFamily}`}
      >
        <header className="reader-chapter-header">
          <div className="reader-chapter-novel-title">{novel.title}</div>
          <h1 className="reader-chapter-title">{chapter.title}</h1>
          <div className="reader-chapter-metadata">
            by {novel.author || 'Author Unknown'}
            {chapter.wordCount && ` • ${chapter.wordCount.toLocaleString()} words`}
          </div>
        </header>

        {/* Paragraph Blocks */}
        <article className="reader-article" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
          {paragraphs.length > 0 ? (
            paragraphs.map((p, idx) => (
              <p key={idx} className="reader-paragraph">
                {p}
              </p>
            ))
          ) : (
            <p className="reader-paragraph">
              No text content available for this chapter installment.
            </p>
          )}
        </article>

        {/* Chapter Navigation Footer */}
        <nav className="reader-nav-footer" aria-label="Chapter pagination">
          {prevChapter ? (
            <Link
              to={`/read/${novelId}/${prevChapter.id || prevChapter.chapterNumber}`}
              className="reader-nav-btn"
              aria-label={`Go to previous chapter: ${prevChapter.title}`}
            >
              <span aria-hidden="true">←</span>
              <span>Previous Chapter</span>
            </Link>
          ) : (
            <button className="reader-nav-btn" disabled>
              <span aria-hidden="true">←</span>
              <span>First Chapter</span>
            </button>
          )}

          {/* Chapter Quick Selector */}
          <select
            className="reader-chapter-select"
            value={chapter.id || chapter.chapterNumber}
            onChange={(e) => navigate(`/read/${novelId}/${e.target.value}`)}
            aria-label="Jump to chapter"
          >
            {allChapters.map((c, idx) => (
              <option key={c.id || idx} value={c.id || c.chapterNumber}>
                {c.title || `Chapter ${c.chapterNumber || idx + 1}`}
              </option>
            ))}
          </select>

          {nextChapter ? (
            <Link
              to={`/read/${novelId}/${nextChapter.id || nextChapter.chapterNumber}`}
              className="reader-nav-btn"
              aria-label={`Go to next chapter: ${nextChapter.title}`}
            >
              <span>Next Chapter</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <button className="reader-nav-btn" disabled>
              <span>Latest Chapter</span>
              <span aria-hidden="true">→</span>
            </button>
          )}
        </nav>

        <div className="reader-keyboard-hints" aria-hidden="true">
          💡 Keyboard shortcut: Use <strong>← Left Arrow</strong> and{' '}
          <strong>Right Arrow →</strong> to flip chapters.
        </div>
      </main>
    </div>
  );
};

export default Reader;
