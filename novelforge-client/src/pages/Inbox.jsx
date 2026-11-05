import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Skeleton } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { studioApi } from '../services/api';

export default function Inbox() {
  const { success, error } = useToast();
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [markingReadId, setMarkingReadId] = useState(null);

  const loadInvitations = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await studioApi.myInvitations();
      setInvitations(Array.isArray(response) ? response : response?.content || []);
    } catch (requestError) {
      setLoadError(requestError.message || 'Could not load your invitations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleAccept = async (invitation) => {
    setAcceptingId(invitation.membershipId);
    try {
      await studioApi.acceptInvitation(invitation.membershipId);
      setInvitations((current) => current.filter((item) => item.membershipId !== invitation.membershipId));
      success(`You joined ${invitation.studioName}.`);
    } catch (requestError) {
      error(requestError.message || 'Could not accept this invitation.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleMarkRead = async (invitation) => {
    setMarkingReadId(invitation.membershipId);
    try {
      const updated = await studioApi.markInvitationRead(invitation.membershipId);
      setInvitations((current) => current.map((item) =>
        item.membershipId === invitation.membershipId ? { ...item, readAt: updated.readAt } : item
      ));
      success('Invitation marked as read.');
    } catch (requestError) {
      error(requestError.message || 'Could not update this invitation.');
    } finally {
      setMarkingReadId(null);
    }
  };

  return (
    <section className="app-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <p className="eyebrow">INBOX</p>
        <h1 style={{ margin: '0.25rem 0', color: 'var(--text-primary)' }}>Studio invitations</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Invitations to collaborate in a NovelForge studio appear here.
        </p>
      </header>

      {isLoading ? (
        <div style={{ display: 'grid', gap: '0.85rem' }} aria-label="Loading invitations">
          {[0, 1, 2].map((item) => (
            <Card key={item}>
              <Skeleton height="22px" width="42%" />
              <Skeleton height="16px" width="64%" style={{ marginTop: '0.75rem' }} />
            </Card>
          ))}
        </div>
      ) : loadError ? (
        <Card role="alert" style={{ display: 'grid', gap: '1rem' }}>
          <p style={{ margin: 0, color: 'var(--text-primary)' }}>{loadError}</p>
          <Button variant="secondary" onClick={loadInvitations}>Retry</Button>
        </Card>
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={null}
          title="You're all caught up"
          description="New studio collaboration invitations will show up here."
          action={<Link className="ui-btn ui-btn-secondary" to="/studio">Open Creator Studio</Link>}
        />
      ) : (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {invitations.map((invitation) => (
            <Card key={invitation.membershipId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <p className="eyebrow" style={{ margin: '0 0 0.35rem' }}>COLLABORATION INVITATION</p>
                  <h2 style={{ margin: 0, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>
                    {invitation.studioName}
                  </h2>
                  <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)' }}>
                    @{invitation.studioHandle} invited you as {invitation.role.toLowerCase()}.
                  </p>
                  {invitation.invitedAt && (
                    <time dateTime={invitation.invitedAt} style={{ display: 'block', marginTop: '0.55rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(invitation.invitedAt).toLocaleDateString()}
                    </time>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Badge variant={invitation.readAt ? 'neutral' : 'warning'}>
                    {invitation.readAt ? 'Read' : 'New'}
                  </Badge>
                  <Badge variant="primary">{invitation.role}</Badge>
                  {!invitation.readAt && (
                    <Button
                      variant="secondary"
                      loading={markingReadId === invitation.membershipId}
                      disabled={markingReadId !== null || acceptingId !== null}
                      onClick={() => handleMarkRead(invitation)}
                    >
                      Mark as read
                    </Button>
                  )}
                  <Button
                    loading={acceptingId === invitation.membershipId}
                    disabled={acceptingId !== null || markingReadId !== null}
                    onClick={() => handleAccept(invitation)}
                  >
                    Accept invitation
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}