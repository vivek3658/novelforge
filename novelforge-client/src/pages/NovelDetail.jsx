import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { novelStore } from '../services/novelStore';
import { chaptersApi } from '../features/chapters/api/chapters.api';
import { engagementApi } from '../features/engagement/api/engagement.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './NovelDetail.css';

const NovelDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [detail, chapterPage] = await Promise.all([novelStore.getNovelById(id), chaptersApi.getChapters(id).catch(() => null)]);
        if (!active) return;
        setNovel(detail);
        setChapters(Array.isArray(chapterPage) ? chapterPage : chapterPage?.content || detail?.chapters || []);
        if (detail && isAuthenticated && !detail.isDemo) setSaved(await engagementApi.watchLaterContains('NOVEL', id));
      } catch (err) { if (active) showError(err.message || 'Unable to load this novel.'); }
    })();
    return () => { active = false; };
  }, [id, isAuthenticated, showError]);

  const toggleSaved = async () => {
    if (!isAuthenticated) return showError('Sign in to save novels to your library.');
    setBusy(true);
    try {
      if (saved) await engagementApi.removeFromWatchLater('NOVEL', id);
      else await engagementApi.saveForLater('NOVEL', id);
      setSaved(!saved);
      success(saved ? 'Removed from Watch later.' : 'Saved to Watch later.');
    } catch (err) { showError(err.message || 'Could not update your library.'); }
    finally { setBusy(false); }
  };

  if (!novel) return <div className="novel-detail-container"><h1>Novel unavailable</h1><p>Try browsing the catalog again.</p><Link to="/novels">Browse novels</Link></div>;
  const first = chapters[0];
  return <div className="novel-detail-container">
    <Link to="/novels" className="novel-detail-back-link">← Discover</Link>
    {novel.isDemo && <p className="catalog-disclaimer-box">Sample title for local preview. Connect the backend to see live catalog data.</p>}
    <header className="novel-detail-hero">
      <div className="novel-cover-large" style={{ background: novel.coverImageUrl ? `center/cover url('${novel.coverImageUrl}')` : novel.gradient || 'linear-gradient(145deg,#312e81,#0f766e)' }}><span className="novel-cover-large-badge">{novel.categoryType || 'STORY'}</span><span className="novel-cover-large-title">{novel.title}</span></div>
      <div className="novel-detail-main"><p className="eyebrow">NOVEL · {novel.publicationState || (novel.isDemo ? 'SAMPLE' : 'PUBLISHED')}</p><h1 className="novel-detail-title">{novel.title}</h1>
        <p className="novel-detail-author">A NovelForge original</p>
        <div className="novel-tags-row">{(novel.genres || []).concat(novel.tags || []).map((tag) => <span className="novel-tag-pill" key={tag}>#{tag}</span>)}</div>
        <div className="novel-detail-actions"><button className="btn-read-now" disabled={!first} onClick={() => first && (window.location.href = `/read/${id}/${first.id || first.chapterNumber}`)}>{first ? 'Read from the beginning' : 'No chapters available'}</button><button className="btn-bookmark-toggle" onClick={toggleSaved} disabled={busy}>{saved ? '✓ Saved' : '+ Watch later'}</button></div>
        <div className="novel-detail-stats"><div className="stat-item"><span className="stat-item-label">Chapters</span><span className="stat-item-value">{chapters.length}</span></div><div className="stat-item"><span className="stat-item-label">Status</span><span className="stat-item-value">{novel.publicationState || 'Ongoing'}</span></div></div>
      </div>
    </header>
    <section className="novel-detail-section"><h2 className="section-headline">About this story</h2><p className="novel-synopsis-text">{novel.synopsis || 'A new story is waiting to be discovered.'}</p></section>
    <section className="novel-detail-section"><div className="chapters-directory-header"><h2 className="section-headline">Chapters</h2><span className="chapters-count-badge">{chapters.length} chapters</span></div>{chapters.length ? <nav className="chapters-list" aria-label="Chapter list">{chapters.map((chapter, i) => <Link className="chapter-row-link" key={chapter.id || i} to={`/read/${id}/${chapter.id || chapter.chapterNumber}`}><span className="chapter-row-title">{chapter.title || `Chapter ${chapter.chapterNumber || i + 1}`}</span><span className="chapter-row-meta">{chapter.publicationState || 'Read'} →</span></Link>)}</nav> : <p>Chapters will appear here when published.</p>}</section>
  </div>;
};

export default NovelDetail;
