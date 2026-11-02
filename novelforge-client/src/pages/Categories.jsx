import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { novelApi } from '../services/api';
import { Button, Skeleton } from '../components/ui';

const CATEGORIES = [
  {
    id: 'FICTION',
    title: 'Fiction',
    note: 'Imagined worlds, unforgettable characters, and novels that keep unfolding.',
    icon: '✦',
  },
  {
    id: 'NONFICTION',
    title: 'Nonfiction',
    note: 'True stories, lived experience, and ideas grounded in the real world.',
    icon: '◈',
  },
];

export default function Categories() {
  const [genres, setGenres] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadFacets = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await novelApi.searchNovels('', 0, 20);
      const novels = res?.content || [];
      const extractedGenres = [...new Set(novels.flatMap((n) => n.genres || []))].sort();
      const extractedTags = [...new Set(novels.flatMap((n) => n.tags || []))].sort();
      setGenres(extractedGenres);
      setTags(extractedTags);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to load categories and genre facets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacets();
  }, []);

  return (
    <section className="product-page">
      <header className="product-heading">
        <div>
          <p className="eyebrow">Browse by shelf</p>
          <h1>Choose a world.</h1>
          <p>Start with a category, then explore genres and tags creators use to describe their novels.</p>
        </div>
      </header>

      {errorMessage && (
        <div className="error-banner" role="alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={loadFacets}>
            Try again
          </Button>
        </div>
      )}

      {/* Main Categories Grid */}
      <div className="category-grid">
        {CATEGORIES.map((cat) => (
          <Link key={cat.id} className="category-tile" to={`/novels?category=${cat.id}`}>
            <span className="category-icon" aria-hidden="true">{cat.icon}</span>
            <span className="eyebrow">Category</span>
            <h2>{cat.title}</h2>
            <p>{cat.note}</p>
            <span className="text-link">
              Explore novels <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Loading Skeletons */}
      {loading && genres.length === 0 && (
        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Skeleton height="32px" width="180px" />
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height="36px" width="110px" borderRadius="999px" />
            ))}
          </div>
        </div>
      )}

      {/* Genres List */}
      {genres.length > 0 && (
        <section className="facet-section">
          <p className="eyebrow">Creator genres</p>
          <div className="facet-list">
            {genres.map((genre) => (
              <Link key={genre} to={`/novels?genre=${encodeURIComponent(genre)}`}>
                {genre}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tags List */}
      {tags.length > 0 && (
        <section className="facet-section">
          <p className="eyebrow">Novel tags</p>
          <div className="facet-list">
            {tags.map((tag) => (
              <Link key={tag} to={`/novels?tag=${encodeURIComponent(tag)}`}>
                #{tag}
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="category-note">Genres and tags are drawn from published novels in the catalog.</p>
    </section>
  );
}
