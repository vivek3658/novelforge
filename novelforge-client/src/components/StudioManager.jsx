import React, { useState, useEffect, useCallback } from 'react';
import { studioApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export const StudioManager = ({ isCreator, onActivateCreator }) => {
  const { success, error, info } = useToast();

  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ studioName: '', studioHandle: '' });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Members Management
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ inviteeUserId: '', role: 'EDITOR' });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  // Invitation Acceptance
  const [invitationId, setInvitationId] = useState('');
  const [acceptingInvite, setAcceptingInvite] = useState(false);

  // Fetch Studios
  const loadStudios = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await studioApi.searchStudios({ query: '', page: 0, size: 20 });
      // Spring Data Page returns content array
      const items = response?.content || (Array.isArray(response) ? response : []);
      setStudios(items);
    } catch (err) {
      console.warn('Could not load studios:', err.message);
      setErrorMsg(err.message || 'Unable to connect to Studio Service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudios();
  }, [loadStudios]);

  // Create Studio Handler
  const handleCreateStudio = async (e) => {
    e.preventDefault();
    if (!createForm.studioName.trim() || !createForm.studioHandle.trim()) {
      error('Please provide both studio name and handle.');
      return;
    }

    setCreateSubmitting(true);
    try {
      const created = await studioApi.createStudio({
        studioName: createForm.studioName.trim(),
        studioHandle: createForm.studioHandle.trim().toLowerCase(),
      });
      success(`Studio "${created.studioName || createForm.studioName}" created successfully!`);
      setShowCreateModal(false);
      setCreateForm({ studioName: '', studioHandle: '' });
      loadStudios();
    } catch (err) {
      error(err.message || 'Failed to create studio.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Load Members for a Studio
  const handleOpenMembers = async (studio) => {
    setSelectedStudio(studio);
    setMembersLoading(true);
    try {
      const res = await studioApi.getMembers(studio.id);
      const memberList = res?.content || (Array.isArray(res) ? res : []);
      setMembers(memberList);
    } catch (err) {
      error(err.message || 'Could not fetch studio members.');
    } finally {
      setMembersLoading(false);
    }
  };

  // Invite Member Handler
  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteForm.inviteeUserId) {
      error('Please enter the user ID to invite.');
      return;
    }

    setInviteSubmitting(true);
    try {
      await studioApi.inviteMember(selectedStudio.id, {
        inviteeUserId: Number(inviteForm.inviteeUserId),
        role: inviteForm.role,
      });
      success(`Invitation sent to User #${inviteForm.inviteeUserId}!`);
      setShowInviteModal(false);
      setInviteForm({ inviteeUserId: '', role: 'EDITOR' });
      // Refresh members
      handleOpenMembers(selectedStudio);
    } catch (err) {
      error(err.message || 'Failed to send studio invitation.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  // Update Member Role
  const handleUpdateRole = async (memberUserId, newRole) => {
    try {
      await studioApi.updateMemberRole(selectedStudio.id, memberUserId, { role: newRole });
      success('Member role updated.');
      handleOpenMembers(selectedStudio);
    } catch (err) {
      error(err.message || 'Failed to update member role.');
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm('Are you sure you want to remove this member from the studio?')) {
      return;
    }
    try {
      await studioApi.removeMember(selectedStudio.id, memberUserId);
      success('Member removed from studio.');
      handleOpenMembers(selectedStudio);
    } catch (err) {
      error(err.message || 'Failed to remove member.');
    }
  };

  // Request Deletion
  const handleRequestDeletion = async (studioId) => {
    if (!window.confirm('Request studio deletion? The studio will be scheduled for permanent deletion.')) {
      return;
    }
    try {
      await studioApi.requestDeletion(studioId);
      info('Studio deletion requested.');
      loadStudios();
    } catch (err) {
      error(err.message || 'Failed to request deletion.');
    }
  };

  // Cancel Deletion
  const handleCancelDeletion = async (studioId) => {
    try {
      await studioApi.cancelDeletion(studioId);
      success('Studio deletion cancelled.');
      loadStudios();
    } catch (err) {
      error(err.message || 'Failed to cancel deletion.');
    }
  };

  // Accept Invitation
  const handleAcceptInvite = async (e) => {
    e.preventDefault();
    if (!invitationId.trim()) return;

    setAcceptingInvite(true);
    try {
      await studioApi.acceptInvitation(invitationId.trim());
      success('Studio invitation accepted! You are now part of the team.');
      setInvitationId('');
      loadStudios();
    } catch (err) {
      error(err.message || 'Failed to accept invitation.');
    } finally {
      setAcceptingInvite(false);
    }
  };

  return (
    <div className="studio-manager-wrapper">
      {/* Non-creator alert banner */}
      {!isCreator && (
        <aside
          role="alert"
          className="chapter-alert-box"
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            borderLeft: '4px solid #f59e0b',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#f59e0b', fontSize: '0.95rem' }}>
              ⚡ Creator Status Required
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              To create collaborative studios and invite co-authors, you need an active Creator account.
            </p>
          </div>
          {onActivateCreator && (
            <button
              onClick={onActivateCreator}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
              }}
            >
              Activate Creator Status
            </button>
          )}
        </aside>
      )}

      {/* Header controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
            Collaborative Studios ({studios.length})
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Syncing live with Studio Service via API Gateway
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!isCreator}
            className="btn-primary"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
          >
            + Create New Studio
          </button>
          <button
            onClick={loadStudios}
            disabled={loading}
            className="action-btn-secondary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.88rem' }}
          >
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Accept invitation bar */}
      <div
        className="pro-card"
        style={{
          background: 'var(--bg-surface-elevated)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <form
          onSubmit={handleAcceptInvite}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            📬 Have an Invitation?
          </span>
          <input
            type="number"
            placeholder="Enter Invitation / Membership ID"
            value={invitationId}
            onChange={(e) => setInvitationId(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              width: '240px',
            }}
          />
          <button
            type="submit"
            disabled={acceptingInvite || !invitationId.trim()}
            className="btn-primary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            {acceptingInvite ? 'Accepting...' : 'Accept Invitation'}
          </button>
        </form>
      </div>

      {/* Error state */}
      {errorMsg && (
        <aside
          role="alert"
          className="chapter-alert-box"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            borderLeft: '4px solid var(--danger)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {errorMsg}</span>
            <button
              onClick={loadStudios}
              className="action-btn-secondary"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
            >
              Retry Connection
            </button>
          </div>
        </aside>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Connecting to Studio Service...
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && studios.length === 0 && !errorMsg && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏢</div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>No Studios Found</h4>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem auto', fontSize: '0.88rem' }}>
            Create a collaborative studio workspace to co-author serialized web novels, invite editors, and manage team publishing.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!isCreator}
            className="btn-primary"
            style={{ padding: '0.6rem 1.4rem' }}
          >
            + Create Your First Studio
          </button>
        </div>
      )}

      {/* Studios Grid */}
      {!loading && studios.length > 0 && (
        <div className="studio-novels-grid">
          {studios.map((studio) => (
            <article
              key={studio.id || studio.studioHandle}
              className="studio-novel-card"
              style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  padding: '1.25rem',
                  color: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    @{studio.studioHandle}
                  </span>
                  {studio.deletedAt && (
                    <span
                      style={{
                        background: 'rgba(239, 68, 68, 0.85)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      Pending Deletion
                    </span>
                  )}
                </div>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{studio.studioName}</h4>
              </div>

              <div style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  <div><strong>ID:</strong> {studio.id}</div>
                  {studio.createdAt && (
                    <div><strong>Created:</strong> {new Date(studio.createdAt).toLocaleDateString()}</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleOpenMembers(studio)}
                    className="action-btn-secondary"
                    style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.82rem', justifyContent: 'center' }}
                  >
                    👥 Members
                  </button>

                  {!studio.deletedAt ? (
                    <button
                      onClick={() => handleRequestDeletion(studio.id)}
                      className="action-btn-secondary"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', color: 'var(--danger)' }}
                      title="Request Studio Deletion"
                    >
                      🗑️ Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCancelDeletion(studio.id)}
                      className="btn-primary"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* CREATE STUDIO MODAL */}
      {showCreateModal && (
        <div className="pro-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="pro-modal"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="create-studio-title"
          >
            <div className="pro-modal-header">
              <h3 id="create-studio-title" className="pro-modal-title">
                🏢 Create Collaborative Studio
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="pro-modal-close"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudio} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Studio Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crimson Quill Studio"
                  value={createForm.studioName}
                  onChange={(e) => setCreateForm({ ...createForm, studioName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Studio Handle *
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRight: 'none',
                      borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="crimson-quill"
                    value={createForm.studioHandle}
                    onChange={(e) => setCreateForm({ ...createForm, studioHandle: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                  Unique handle (letters, numbers, hyphens only).
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="action-btn-secondary"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.4rem' }}
                >
                  {createSubmitting ? 'Creating...' : 'Create Studio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBERS MANAGEMENT MODAL */}
      {selectedStudio && (
        <div className="pro-modal-overlay" onClick={() => setSelectedStudio(null)}>
          <div
            className="pro-modal"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="members-modal-title"
          >
            <div className="pro-modal-header">
              <h3 id="members-modal-title" className="pro-modal-title">
                👥 Members: {selectedStudio.studioName} (@{selectedStudio.studioHandle})
              </h3>
              <button
                onClick={() => setSelectedStudio(null)}
                className="pro-modal-close"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Total Team Members: {members.length}
                </span>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="btn-primary"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                >
                  + Invite Member
                </button>
              </div>

              {membersLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.5rem auto' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading members...</p>
                </div>
              ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>No members registered yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
                  {members.map((m) => (
                    <div
                      key={m.id || m.userId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                          User #{m.userId}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Status: {m.status || 'ACTIVE'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={m.role || 'MEMBER'}
                          onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            fontSize: '0.82rem',
                          }}
                        >
                          <option value="OWNER">OWNER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="EDITOR">EDITOR</option>
                          <option value="PROOFREADER">PROOFREADER</option>
                          <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                        </select>

                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          className="action-btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                          title="Remove Member"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && selectedStudio && (
        <div className="pro-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div
            className="pro-modal"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="invite-modal-title"
          >
            <div className="pro-modal-header">
              <h3 id="invite-modal-title" className="pro-modal-title">
                📬 Invite Team Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="pro-modal-close"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteMember} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Invitee User ID *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 42"
                  value={inviteForm.inviteeUserId}
                  onChange={(e) => setInviteForm({ ...inviteForm, inviteeUserId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Assign Role *
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="EDITOR">EDITOR (Edit chapters & drafts)</option>
                  <option value="PROOFREADER">PROOFREADER (Review & check grammar)</option>
                  <option value="CONTRIBUTOR">CONTRIBUTOR (Write chapters)</option>
                  <option value="ADMIN">ADMIN (Full management)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="action-btn-secondary"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.4rem' }}
                >
                  {inviteSubmitting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioManager;
