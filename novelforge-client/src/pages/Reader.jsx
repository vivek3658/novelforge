import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { novelStore } from '../services/novelStore';
import './Reader.css';

const Reader = () => {
  const { novelId, chapterId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('novelforge_reader_fontsize')) || 19);
  const [theme, setTheme] = useState(() => localStorage.getItem('novelforge_reader_theme') || 'sepia');
  useEffect(() => { let active = true; novelStore.getChapter(novelId, chapterId).then((result) => { if (active) setData(result); }).catch((err) => { if (active) setError(err.message || 'Chapter could not be loaded.'); }); return () => { active = false; }; }, [novelId, chapterId]);
  useEffect(() => { const onScroll = () => { const range = document.documentElement.scrollHeight - innerHeight; document.documentElement.style.setProperty('--reading-progress', `${range <= 0 ? 0 : (scrollY / range) * 100}%`); }; addEventListener('scroll', onScroll, { passive: true }); return () => removeEventListener('scroll', onScroll); }, []);
  if (error) return <main className="reader-page-wrapper reader-theme-sepia reader-empty"><p>{error}</p><Link to={`/novels/${novelId}`}>Back to novel</Link></main>;
  if (!data) return <main className="reader-page-wrapper reader-theme-sepia reader-empty" aria-live="polite">Opening your book…</main>;
  const { novel, chapter } = data;
  const blocks = chapter.blocks || (chapter.paragraphs || []).map((text, position) => ({ type: 'TEXT', text, position }));
  return <div className={`reader-page-wrapper reader-theme-${theme}`}>
    <div className="reader-progress-bar" />
    <header className="reader-toolbar"><div className="reader-toolbar-inner"><Link className="reader-nav-back" to={`/novels/${novelId}`}>← <span>Contents</span></Link><span className="reader-title-preview">{novel.title} · {chapter.title}</span><div className="reader-controls-cluster"><button className="reader-control-btn" aria-label="Decrease text size" onClick={() => setFontSize((size) => { const next = Math.max(15, size - 1); localStorage.setItem('novelforge_reader_fontsize', String(next)); return next; })}>A−</button><button className="reader-control-btn" aria-label="Increase text size" onClick={() => setFontSize((size) => { const next = Math.min(28, size + 1); localStorage.setItem('novelforge_reader_fontsize', String(next)); return next; })}>A+</button><button className="reader-control-btn" onClick={() => { const next = theme === 'sepia' ? 'light' : theme === 'light' ? 'dark' : 'sepia'; setTheme(next); localStorage.setItem('novelforge_reader_theme', next); }}>Theme</button></div></div></header>
    <main className="reader-content-container reader-width-comfortable"><header className="reader-chapter-header"><p className="reader-chapter-novel-title">{novel.title}</p><h1 className="reader-chapter-title">{chapter.title}</h1><p className="reader-chapter-metadata">Chapter {chapter.chapterNumber || ''}</p></header><article className="reader-article" style={{ fontSize: `${fontSize}px` }}>{blocks.map((block, index) => block.type === 'IMAGE' ? <figure key={block.id || index} className="reader-illustration"><img src={block.imageUrl} alt={block.altText || block.caption || ''} loading="lazy" />{block.caption && <figcaption>{block.caption}</figcaption>}</figure> : <p key={block.id || index} className="reader-paragraph">{block.text}</p>)}</article><footer className="reader-nav-footer"><Link className="reader-nav-btn" to={`/novels/${novelId}`}>Back to contents</Link><span>You’re all caught up</span></footer></main>
  </div>;
};
export default Reader;
