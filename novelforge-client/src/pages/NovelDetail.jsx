import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { novelApi, chaptersApi, engagementApi } from '../services/api';
import { Button, Textarea, Avatar, Skeleton, EmptyState } from '../components/ui';

export default function NovelDetail() {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();

  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadNovelData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [novelData, chaptersData] = await Promise.all([
        novelApi.getNovelById(novelId),
        chaptersApi.listPublic(novelId, 0, 50),
      ]);
      setNovel(novelData);
      setChapters(chaptersData?.content || []);

      // Fetch comments safely
      try {
        const commentsData = await engagementApi.comments('NOVEL', novelId);
        setComments(commentsData?.content || []);
      } catch {
        setComments([]);
      }

      // Fetch like count safely
      try {
        const likeData = await engagementApi.likeCount('NOVEL', novelId);
        setLikesCount(likeData?.count ?? 0);
      } catch {
        // Continue if like count fails
      }
    } catch (err) {
      setErrorMessage(err.message || 'This novel could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [novelId]);

  useEffect(() => {
    loadNovelData();
  }, [loadNovelData]);

  const handleSaveToLibrary = async () => {
    if (!isAuthenticated) {
      toastError('Sign in to save this novel to your library.');
      return;
    }
    try {
      await engagementApi.saveNovel(novelId);
      success('Novel saved to your reading shelf.');
    } catch (err) {
      toastError(err.message || 'Unable to save this novel.');
    }
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      toastError('Sign in to like this novel.');
      return;
    }
    try {
      if (isLiked) {
        const res = await engagementApi.unlike('NOVEL', novelId);
        setIsLiked(false);
        setLikesCount(res?.count ?? Math.max(0, likesCount - 1));
      } else {
        const res = await engagementApi.like('NOVEL', novelId);
        setIsLiked(true);
        setLikesCount(res?.count ?? likesCount + 1);
      }
    } catch (err) {
      toastError(err.message || 'Unable to update your like.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await engagementApi.addComment('NOVEL', novelId, commentText.trim());
      setCommentText('');
      const commentsData = await engagementApi.comments('NOVEL', novelId);
      setComments(commentsData?.content || []);
      success('Comment added to the discussion!');
    } catch (err) {
      toastError(err.message || 'Unable to post your comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <section className="product-page">
        <Skeleton height="36px" width="120px" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: '2rem' }}>
          <Skeleton height="380px" borderRadius="16px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Skeleton height="20px" width="100px" />
            <Skeleton height="40px" width="60%" />
            <Skeleton height="100px" width="90%" />
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
              <Skeleton height="44px" width="140px" borderRadius="10px" />
              <Skeleton height="44px" width="140px" borderRadius="10px" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (errorMessage || !novel) {
    return (
      <section className="product-page">
        <div className="error-banner" role="alert">
          {errorMessage || 'Novel not found or is no longer available.'}
        </div>
        <Link to="/novels" className="text-link">
          ← Back to the catalog
        </Link>
      </section>
    );
  }

  const allTags = [...(novel.genres || []), ...(novel.tags || [])];

  return (
    <section className="product-page">
      <Link to="/novels" className="back-link">
        ← All novels
      </Link>

      {/* Main Story Hero */}
      <div className="story-detail">
        {novel.coverImageUrl ? (
          <div className="story-cover detail-cover" style={{ padding: 0, overflow: 'hidden' }}>
            <img
              src={novel.coverImageUrl}
              alt={novel.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div className="story-cover cover-forest detail-cover">
            <span className="story-cover-kicker">{novel.categoryType || 'NOVEL'}</span>
            <span className="story-cover-title">{novel.title}</span>
            <span className="story-cover-mark">NF</span>
          </div>
        )}

        <div className="story-detail-copy">
          <p className="eyebrow">{novel.publicationState || 'Published Novel'}</p>
          <h1>{novel.title}</h1>
          <p>{novel.synopsis || 'A serialized story from a NovelForge creator.'}</p>

          {allTags.length > 0 && (
            <div className="story-tags">
              {allTags.map((t, idx) => (
                <span key={`${t}-${idx}`}>{t}</span>
              ))}
            </div>
          )}

          <div className="detail-actions">
            <Button
              variant="primary"
              disabled={chapters.length === 0}
              onClick={() => {
                if (chapters[0]) {
                  navigate(`/novels/${novelId}/read/${chapters[0].id}`);
                }
              }}
            >
              {chapters.length > 0 ? 'Start reading →' : 'No chapters published yet'}
            </Button>
            <Button variant="secondary" onClick={handleSaveToLibrary}>
              ＋ Save to library
            </Button>
            <Button
              variant={isLiked ? 'primary' : 'quiet'}
              onClick={handleToggleLike}
              aria-pressed={isLiked}
            >
              {isLiked ? '♥' : '♡'} {likesCount > 0 ? likesCount : 'Like'}
            </Button>
          </div>
        </div>
      </div>

      {/* Chapters & Discussion Columns */}
      <div className="detail-columns">
        {/* Chapter List */}
        <section className="chapter-list">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Table of contents</p>
              <h2>Chapters</h2>
            </div>
            <span className="small-muted">{chapters.length} available</span>
          </div>

          {chapters.length > 0 ? (
            chapters.map((ch) => (
              <Link key={ch.id} to={`/novels/${novelId}/read/${ch.id}`} className="chapter-row-link">
                <span className="chapter-row-cover">
                  {novel.coverImageUrl && <img src={novel.coverImageUrl} alt="" loading="lazy" />}
                </span>
                <span className="chapter-row-meta">
                  <small>CHAPTER {ch.chapterNumber}</small>
                  <strong>{ch.title || `Chapter ${ch.chapterNumber}`}</strong>
                  {ch.publishedAt && <small>Published {new Date(ch.publishedAt).toLocaleDateString()}</small>}
                </span>
                <span className="chapter-open-label">Read chapter</span>
              </Link>
            ))
          ) : (
            <p className="small-muted" style={{ padding: '1rem 0' }}>
              The author is currently drafting the manuscript. New chapters will appear here as soon as they are published.
            </p>
          )}
        </section>

        {/* Reader Discussion */}
        <section className="discussion">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Readers</p>
              <h2>Discussion</h2>
            </div>
            <span className="small-muted">{comments.length} comments</span>
          </div>

          {isAuthenticated ? (
            <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Textarea
                placeholder="Share your thoughts about this story…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={2000}
                rows={3}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="primary" size="sm" loading={submittingComment}>
                  Post comment
                </Button>
              </div>
            </form>
          ) : (
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)' }}>
              <Link to="/login" className="text-link">Sign in</Link> to join the community discussion.
            </p>
          )}

          {comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {comments.map((comm) => (
                <article key={comm.id} className="comment-item">
                  <Avatar name="Reader" size="sm" />
                  <div>
                    <small>
                      Reader · {new Date(comm.createdAt).toLocaleDateString()}
                    </small>
                    <p style={{ margin: '0.3rem 0 0', whiteSpace: 'pre-wrap' }}>{comm.content}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="💬"
              title="No comments yet"
              description="Be the first reader to start a discussion about this novel."
            />
          )}
        </section>
      </div>
    </section>
  );
}
