import React from 'react';
import './Home.css';

const DISCUSSIONS = [
  {
    title: 'Chapter 142 Discussion: The Revelation of the Star Monarch',
    novel: 'Shadows of the Astral Realm',
    replies: 84,
    author: 'AstralFan99',
    tag: 'Theory / Discussion',
  },
  {
    title: 'Worldbuilding Tips: How to build a balanced cultivation power hierarchy?',
    novel: 'Writer Workshop',
    replies: 156,
    author: 'Elena Vance (Author)',
    tag: 'Writing Craft',
  },
  {
    title: 'Favorite cyberpunk plot twists of the month',
    novel: 'Cyberpunk Odyssey 2099',
    replies: 42,
    author: 'NeonRider',
    tag: 'Reader Chat',
  },
];

const Community = () => {
  return (
    <div className="app-container" style={{ padding: '3rem 1.5rem 5rem 1.5rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">💬 NovelForge Community</h1>
          <p className="section-subtitle">Connect with fellow web novelists, theory crafters, and enthusiastic readers</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {DISCUSSIONS.map((item, idx) => (
          <div
            key={idx}
            className="feature-card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
          >
            <div>
              <span className="badge badge-role" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                {item.tag}
              </span>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {item.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                in <strong>{item.novel}</strong> • started by <em>{item.author}</em>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>
              <span>💬</span>
              <span>{item.replies} Replies</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Community;
