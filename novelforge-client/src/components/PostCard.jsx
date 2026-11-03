import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { engagementApi } from '../services/api';

export default function PostCard({ post, onDelete }) {
  const { user, isAuthenticated } = useAuth();
  const { success, error } = useToast();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor =
    user &&
    (String(post.createdByUserId) === String(user.id) ||
      String(post.authorId) === String(user.id));

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      error('Sign in to like this update.');
      return;
    }
    try {
      if (isLiked) {
        await engagementApi.unlike('POST', post.id);
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await engagementApi.like('POST', post.id);
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (err) {
      error(err.message || 'Unable to update like.');
    }
  };

  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState && comments.length === 0) {
      try {
        const res = await engagementApi.comments('POST', post.id, 0);
        setComments(res?.content || []);
      } catch (err) {
        error(err.message || 'Failed to load comments.');
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await engagementApi.addComment('POST', post.id, commentText.trim());
      const res = await engagementApi.comments('POST', post.id, 0);
      setComments(res?.content || []);
      setCommentText('');
      success('Comment posted!');
    } catch (err) {
      error(err.message || 'Failed to post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const submitCommentOnShortcut = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleShare = async () => {
    if (!isAuthenticated) {
      error('Sign in to share.');
      return;
    }
    try {
      await engagementApi.sharePost(post.id);
      setShareCount((prev) => prev + 1);
      success('Post shared to your network!');
    } catch (err) {
      error(err.message || 'Failed to share post.');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this community post?')) return;
    setIsDeleting(true);
    try {
      await engagementApi.deletePost(post.id);
      success('Post deleted.');
      if (typeof onDelete === 'function') {
        onDelete(post.id);
      }
    } catch (err) {
      error(err.message || 'Failed to delete post.');
    } finally {
      setIsDeleting(false);
    }
  };

  const avatarInitial = post.authorType === 'STUDIO' ? 'S' : 'C';
  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <article className="ig-post-card">
      <header className="ig-post-header">
        <div className="ig-post-user">
          <div className="ig-post-avatar">
            <div className="ig-post-avatar-inner">{avatarInitial}</div>
          </div>
          <div className="ig-post-usernames">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <strong>
                {post.authorType === 'STUDIO' ? 'Studio Broadcast' : 'Creator Update'}
              </strong>
            </div>
            <small>
              {post.authorType === 'STUDIO' ? 'Studio channel' : 'Creator'} · {formattedDate}
            </small>
          </div>
        </div>

        {isAuthor && (
          <button
            type="button"
            onClick={handleDeletePost}
            disabled={isDeleting}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
            title="Delete this post"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </header>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post media"
          className="ig-post-media"
          loading="lazy"
          onDoubleClick={handleToggleLike}
          style={{ cursor: 'pointer' }}
        />
      )}

      <div className="ig-action-bar">
        <div className="ig-action-group">
          <button
            type="button"
            className={`ig-icon-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleToggleLike}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <span aria-hidden="true">{isLiked ? '♥' : '♡'}</span>
            <span>{isLiked ? 'Liked' : 'Like'}</span>
          </button>
          <button
            type="button"
            className="ig-icon-btn"
            onClick={handleToggleComments}
            title="Comments"
          >
            <span aria-hidden="true">▤</span>
            <span>Comments</span>
          </button>
          <button type="button" className="ig-icon-btn" onClick={handleShare} title="Share">
            <span aria-hidden="true">↗</span>
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="ig-likes-count">
        {likesCount > 0
          ? `${likesCount} ${likesCount === 1 ? 'like' : 'likes'}`
          : 'Be the first to like this'}
        {shareCount > 0 && (
          <span style={{ marginLeft: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            • {shareCount} shares
          </span>
        )}
      </div>

      <div className="ig-post-body" style={{ paddingTop: '0.2rem' }}>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{post.content}</p>
        {post.tags?.length > 0 && (
          <div className="ig-post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="ig-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '0 1.15rem 0.5rem' }}>
        <button
          type="button"
          onClick={handleToggleComments}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {showComments
            ? 'Hide comments'
            : comments.length > 0
            ? `View all ${comments.length} comments`
            : 'View discussion'}
        </button>
      </div>

      {showComments && (
        <section className="ig-comments-section">
          {comments.map((c) => (
            <div key={c.id} className="ig-comment-row">
              <strong>Reader:</strong>
              <span>{c.content}</span>
            </div>
          ))}
          {comments.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '0.25rem 0' }}>
              No comments yet. Start the conversation!
            </div>
          )}
          {isAuthenticated ? (
            <form className="ig-comment-form" onSubmit={handleAddComment}>
              <input
                className="ig-comment-input"
                placeholder="Add a comment as reader…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={submitCommentOnShortcut}
                maxLength={1000}
                required
                aria-label="Write a comment"
              />
              <button
                type="submit"
                className="ig-comment-post-btn"
                disabled={isSubmittingComment || !commentText.trim()}
              >
                {isSubmittingComment ? '…' : 'Post'}
              </button>
              <span className="composer-shortcut-hint">Ctrl/⌘ + Enter to post</span>
            </form>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Sign in to leave a comment.
            </div>
          )}
        </section>
      )}
    </article>
  );
}
