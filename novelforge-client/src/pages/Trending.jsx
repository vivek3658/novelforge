import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NovelCard from '../components/NovelCard';
import { novelApi } from '../services/api';
import { Button, EmptyState, Skeleton } from '../components/ui';

export default function Trending() {
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchTrendingNovels = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await novelApi.searchNovels('', 0, 16);
      setNovels(res?.content || []);
    } catch (err) {
      setErrorMessage(err.message || 'Novels are currently unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingNovels();
  }, []);

  return (
    <section className="product-page">
      <header className="product-heading">
        <div>
          <p className="eyebrow">Recently published</p>
          <h1>Fresh from the page.</h1>
          <p>The latest published novels from NovelForge creators.</p>
        </div>
        <Link className="quiet-button" to="/novels">
          Browse full catalog <span aria-hidden="true">→</span>
        </Link>
      </header>

      {errorMessage && (
        <div className="error-banner" role="alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={fetchTrendingNovels}>
            Try again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="story-grid home-book-shelf" style={{ marginTop: '1.5rem' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <Skeleton height="260px" borderRadius="14px" />
              <Skeleton height="18px" width="75%" />
              <Skeleton height="14px" width="50%" />
            </div>
          ))}
        </div>
      ) : novels.length > 0 ? (
        <div className="story-grid home-book-shelf">
          {novels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📖"
          title="Nothing published yet"
          description="When a creator publishes a novel, it will appear here fresh from the press."
          action={
            <Link to="/studio" className="ui-btn ui-btn-primary">
              Launch Creator Studio
            </Link>
          }
          secondaryAction={
            <Link to="/novels" className="ui-btn ui-btn-secondary">
              Explore Catalog
            </Link>
          }
        />
      )}
    </section>
  );
}
