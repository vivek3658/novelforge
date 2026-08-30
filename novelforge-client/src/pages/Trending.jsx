import React, { useState } from 'react';
import './Home.css';

const TRENDING_LIST = [
  {
    id: 1,
    rank: 1,
    title: 'Shadows of the Astral Realm',
    author: 'Elena Vance',
    genre: 'Fantasy / Cultivation',
    synopsis: 'A fallen prodigy discovers an ancient forbidden scroll that binds cosmic constellations to his spirit soul.',
    rating: 4.9,
    views: '124K',
    chapters: 142,
    gradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
  },
  {
    id: 2,
    rank: 2,
    title: 'Cyberpunk Odyssey 2099',
    author: 'Kaelen Cross',
    genre: 'Sci-Fi / Cyberpunk',
    synopsis: 'In a rain-drenched megacity governed by neural AI overlords, a rogue data smuggler uncovers a fatal glitch in humanity.',
    rating: 4.8,
    views: '98K',
    chapters: 89,
    gradient: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
  },
  {
    id: 3,
    rank: 3,
    title: 'The Alchemist of Forgotten Stars',
    author: 'Aria Thorne',
    genre: 'LitRPG / Adventure',
    synopsis: 'When modern potion brewing meets high fantasy system progression, one forgotten craft turns the tides of war.',
    rating: 4.95,
    views: '210K',
    chapters: 230,
    gradient: 'linear-gradient(135deg, #065f46, #10b981)',
  },
  {
    id: 4,
    rank: 4,
    title: 'Chronicles of the Broken Throne',
    author: 'Marcus Vance',
    genre: 'Epic Fantasy',
    synopsis: 'Seven kingdoms collide under the omen of the twin moons. Betrayal, honor, and ancient beasts awaken.',
    rating: 4.7,
    views: '86K',
    chapters: 64,
    gradient: 'linear-gradient(135deg, #7c2d12, #ea580c)',
  },
  {
    id: 5,
    rank: 5,
    title: 'Reincarnation of the Void Monarch',
    author: 'Jin Woo',
    genre: 'Action / Reincarnation',
    synopsis: 'Betrayed by the high gods, the Void Monarch awakens in the mortal realm as a disgraced count’s third son.',
    rating: 4.88,
    views: '175K',
    chapters: 195,
    gradient: 'linear-gradient(135deg, #312e81, #6366f1)',
  },
  {
    id: 6,
    rank: 6,
    title: 'Moonlight Necromancer',
    author: 'Seraphina Vale',
    genre: 'Dark Fantasy / System',
    synopsis: 'Given a forbidden dark class in a holy cathedral academy, she must summon shadows in secret to protect her realm.',
    rating: 4.82,
    views: '115K',
    chapters: 110,
    gradient: 'linear-gradient(135deg, #581c87, #c084fc)',
  },
];

const Trending = () => {
  const [filter, setFilter] = useState('all');

  const filtered = TRENDING_LIST.filter((item) => {
    if (filter === 'fantasy') return item.genre.toLowerCase().includes('fantasy');
    if (filter === 'scifi') return item.genre.toLowerCase().includes('sci-fi');
    if (filter === 'action') return item.genre.toLowerCase().includes('action') || item.genre.toLowerCase().includes('litrpg');
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
        {['all', 'fantasy', 'scifi', 'action'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '20px',
              border: filter === tab ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
              background: filter === tab ? 'var(--primary-light)' : 'var(--bg-surface)',
              color: filter === tab ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'all' ? 'All Genres' : tab}
          </button>
        ))}
      </div>

      <div className="novels-grid">
        {filtered.map((novel) => (
          <article key={novel.id} className="novel-card">
            <div className="novel-cover-placeholder" style={{ background: novel.gradient }}>
              <span className="novel-badge-tag">#{novel.rank} Trending</span>
              <span style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>{novel.title}</span>
            </div>
            <div className="novel-info">
              <h3 className="novel-title">{novel.title}</h3>
              <div className="novel-author">by {novel.author}</div>
              <p className="novel-synopsis">{novel.synopsis}</p>
              <div className="novel-stats">
                <span className="novel-rating">★ {novel.rating}</span>
                <span>{novel.chapters} Chs</span>
                <span>{novel.views} reads</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Trending;
