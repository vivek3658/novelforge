import React from 'react';
import { Link } from 'react-router-dom';

const COVER_STYLES = ['book-cover-fern', 'book-cover-midnight', 'book-cover-terracotta', 'book-cover-ocean'];

export default function NovelCard({ novel, onSave, saved = false }) {
  const coverStyle = COVER_STYLES[Math.abs(Number(novel.id) || 0) % COVER_STYLES.length];
  const category = novel.categoryType === 'NONFICTION' ? 'Nonfiction' : 'Fiction';
  const genres = novel.genres?.slice(0, 2) || [];

  return (
    <article className="story-card book-card">
      <Link
        className={`story-cover book-cover ${coverStyle}`}
        to={`/novels/${novel.id}`}
        aria-label={`Open ${novel.title}`}
        style={
          novel.coverImageUrl
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.75) 100%), url(${novel.coverImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <span className="book-cover-topline">NovelForge · {category}</span>
        <span className="story-cover-title book-cover-title">{novel.title}</span>
        <span className="book-cover-details">
          {genres.length ? genres.join(' · ') : 'A serialized original'}
        </span>
        <span className="book-cover-footer">
          <span>{novel.publicationState === 'PUBLISHED' ? 'Now reading' : 'In the making'}</span>
          <span className="book-cover-mark">NF</span>
        </span>
      </Link>
      {onSave && (
        <button
          className={`book-save-button${saved ? ' is-saved' : ''}`}
          type="button"
          onClick={() => onSave(novel)}
          aria-label={saved ? `Remove ${novel.title} from your library` : `Save ${novel.title} to your library`}
          aria-pressed={saved}
          title={saved ? 'Saved to your library' : 'Save to your library'}
        >
          {saved ? '✓' : '+'}
        </button>
      )}
    </article>
  );
}
