import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Avatar, Badge } from './ui';
import { authApi, studioApi } from '../services/api';

const STUDIO_ROLES = [
  { value: 'WRITER', label: 'Writer (Create & edit novel drafts)' },
  { value: 'EDITOR', label: 'Editor (Review & polish manuscripts)' },
  { value: 'ILLUSTRATOR', label: 'Illustrator (Add chapter illustrations)' },
  { value: 'TRANSLATOR', label: 'Translator (Translate chapters)' },
];

export default function StudioInviteCollaborator({ studioId, currentMembers = [], onInviteSent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedRole, setSelectedRole] = useState('WRITER');
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error' | 'info', text: string }

  // Debounced directory search (safe fields only)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await authApi.searchUsers(searchQuery, 10);
        const normalizedResults = Array.isArray(response) ? response : [];
        setSearchResults(normalizedResults.filter((person) => person && person.id));
      } catch (error) {
        setSearchResults([]);
        setStatusMessage({
          type: 'error',
          text: error?.message || 'Could not search collaborators right now.',
        });
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectPerson = (person) => {
    // Check if already member
    const isMember = currentMembers.some(
      (m) => String(m.memberUserId || m.userId) === String(person.id)
    );
    if (isMember) {
      setStatusMessage({
        type: 'info',
        text: `@${person.username} is already an active collaborator in this studio.`,
      });
      return;
    }

    setSelectedPerson(person);
    setSearchQuery('');
    setSearchResults([]);
    setStatusMessage(null);
  };

  const handleSendInvite = async () => {
    if (!selectedPerson || !studioId) return;

    setSending(true);
    setStatusMessage(null);
    try {
      // Passes opaque numeric ID internally; user only interacted with @username / displayName
      await studioApi.inviteMember(studioId, {
        inviteeUserId: selectedPerson.id,
        role: selectedRole,
      });

      setStatusMessage({
        type: 'success',
        text: `Invitation sent to @${selectedPerson.username} as ${selectedRole}!`,
      });
      setSelectedPerson(null);
      if (onInviteSent) onInviteSent();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Could not send invitation. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="cr-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem' }}>Invite a Collaborator</h3>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Search for authors, editors, or illustrators by username or email. Internal account IDs are never exposed or required.
        </p>
      </div>

      {/* Selected Person Chip */}
      {selectedPerson ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            background: 'var(--primary-light)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Avatar src={selectedPerson.avatarUrl} name={selectedPerson.displayName || selectedPerson.username} size="md" />
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                {selectedPerson.displayName || selectedPerson.username}
              </strong>
              <small style={{ color: 'var(--text-muted)' }}>@{selectedPerson.username}</small>
            </div>
          </div>
          <Button variant="quiet" size="sm" onClick={() => setSelectedPerson(null)}>
            ✕ Change
          </Button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <Input
            label="Search collaborator"
            placeholder="Type @username or email address…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Autocomplete Dropdown */}
          {searching && (
            <div
              style={{
                padding: '0.85rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-surface-elevated)',
                borderRadius: '8px',
                marginTop: '0.35rem',
              }}
            >
              Searching directory…
            </div>
          )}

          {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div
              style={{
                padding: '1rem',
                fontSize: '0.86rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                marginTop: '0.4rem',
                lineHeight: 1.5,
              }}
            >
              <Badge variant="warning" style={{ marginBottom: '0.5rem' }}>Directory Search Gap</Badge>
              <p style={{ margin: 0 }}>
                Public user search is pending backend directory endpoint implementation (see <code>docs/BACKEND_GAPS.md</code>). In accordance with security rules, NovelForge does not permit entering raw account IDs.
              </p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 20,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-lg)',
                marginTop: '0.35rem',
                maxHeight: '220px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((person) => (
                <button
                  type="button"
                  key={person.id}
                  onClick={() => handleSelectPerson(person)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Avatar src={person.avatarUrl} name={person.displayName || person.username} size="sm" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>{person.displayName || person.username}</strong>
                    <small style={{ color: 'var(--text-muted)' }}>@{person.username}</small>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role Picker & Submit Button */}
      {selectedPerson && (
        <div style={{ display: 'grid', gap: '1rem', marginTop: '0.5rem' }}>
          <Select
            label="Studio Permission / Role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={STUDIO_ROLES}
          />

          <Button
            variant="primary"
            onClick={handleSendInvite}
            loading={sending}
            style={{ width: '100%' }}
          >
            Send Studio Invitation →
          </Button>
        </div>
      )}

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`auth-alert ${
            statusMessage.type === 'error'
              ? 'auth-alert-error'
              : statusMessage.type === 'success'
              ? 'auth-alert-success'
              : 'auth-alert-info'
          }`}
          role="status"
          style={{ margin: 0 }}
        >
          <span>{statusMessage.type === 'error' ? '⚠' : '✓'}</span>
          <div>{statusMessage.text}</div>
        </div>
      )}
    </div>
  );
}
