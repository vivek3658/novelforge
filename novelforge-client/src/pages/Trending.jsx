import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DUMMY_NOVELS } from '../services/dummyNovels';
import './Home.css';

const Trending = () => {
  const [filter, setFilter] = useState('all');

  const filtered = DUMMY_NOVELS.filter((item) => {
    if (filter === 'fantasy') return (item.genre || '').toLowerCase().includes('fantasy');
    if (filter === 'scifi') return (item.genre || '').toLowerCase().includes('sci-fi') || (item.genre || '').toLowerCase().includes('cyberpunk');
    if (filter === 'nonfiction') return item.categoryType === 'NONFICTION';
    return true;
  });

  return (
    <div className="app-container" style={{ padding: '3rem 1.5rem 5rem 1.5rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">🔥 Trending Web Novels</h1>
          <p className="section-subtitle">Real-time reader rankings, popular serializations & community favorites</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Works' },
          { id: 'fantasy', label: 'Fantasy & Cultivation' },
          { id: 'scifi', label: 'Sci-Fi & Cyberpunk' },
          { id: 'nonfiction', label: 'Non-Fiction' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '20px',
              border: filter === tab.id ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
              background: filter === tab.id ? 'var(--primary-light)' : 'var(--bg-surface)',
              color: filter === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="novels-grid">
        {filtered.map((novel, idx) => (
          <Link
            key={novel.id}
            to={`/novels/${novel.id}`}
            className="novel-card"
            style={{ textDecoration: 'none', color: 'inherit' }}
            aria-label={`View trending novel #${idx + 1}: ${novel.title}`}
          >
            <div className="novel-cover-placeholder" style={{ background: novel.gradient }}>
              <span className="novel-badge-tag">#{idx + 1} Trending</span>
              <span style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>{novel.title}</span>
            </div>
            <div className="novel-info">
              <h2 className="novel-title" style={{ fontSize: '1.15rem', margin: '0 0 0.35rem 0' }}>
                {novel.title}
              </h2>
              <div className="novel-author">by {novel.author}</div>
              <p className="novel-synopsis">{novel.synopsis}</p>
              <div className="novel-stats">
                <span className="novel-rating">★ {novel.rating}</span>
                <span>{novel.chapters?.length || 0} Chs</span>
                <span>{novel.views} reads</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Trending;
