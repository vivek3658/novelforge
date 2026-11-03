import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminApi, moderationApi } from '../services/api';

export default function AdminConsole() {
  const { roles, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const isAdmin = roles.includes('ADMIN');
  const isModerator = roles.includes('MODERATOR') || isAdmin;

  const [activeTab, setActiveTab] = useState(isAdmin ? 'stats' : 'moderation');
  const [loading, setLoading] = useState(false);

  // Stats State
  const [adminStats, setAdminStats] = useState(null);
  const [modStats, setModStats] = useState(null);

  // User Management State
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userPage, setUserPage] = useState(0);
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingRoles, setEditingRoles] = useState([]);

  // Moderation State
  const [reports, setReports] = useState([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDING');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [reportPage, setReportPage] = useState(0);
  const [totalReportPages, setTotalReportPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveAction, setResolveAction] = useState('RESOLVE');
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Redirect if not authorized
  useEffect(() => {
    if (isAuthenticated && !isModerator) {
      error('Access restricted to administrators and moderators.');
      navigate('/');
    }
  }, [isAuthenticated, isModerator, navigate, error]);

  // Load Platform Stats
  const loadStats = useCallback(async () => {
    try {
      const [aStats, mStats] = await Promise.all([
        isAdmin ? adminApi.getStats().catch(() => null) : null,
        moderationApi.getStats().catch(() => null),
      ]);
      if (aStats) setAdminStats(aStats);
      if (mStats) setModStats(mStats);
    } catch (err) {
      console.warn('Failed to load admin stats:', err);
    }
  }, [isAdmin]);

  // Load Users
  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        query: userQuery,
        role: roleFilter,
        accountStatus: statusFilter,
        page: userPage,
        size: 15,
      });
      setUsers(res.content || []);
      setTotalUserPages(res.totalPages || 1);
    } catch (err) {
      error(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, userQuery, roleFilter, statusFilter, userPage, error]);

  // Load Moderation Reports
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await moderationApi.getReports({
        status: reportStatusFilter,
        targetType: targetTypeFilter,
        page: reportPage,
        size: 15,
      });
      setReports(res.content || []);
      setTotalReportPages(res.totalPages || 1);
    } catch (err) {
      error(err.message || 'Failed to load moderation reports');
    } finally {
      setLoading(false);
    }
  }, [reportStatusFilter, targetTypeFilter, reportPage, error]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      loadUsers();
    }
  }, [activeTab, isAdmin, loadUsers]);

  useEffect(() => {
    if (activeTab === 'moderation') {
      loadReports();
    }
  }, [activeTab, loadReports]);

  // Handle Role Change
  const handleUpdateRoles = async (userId) => {
    try {
      await adminApi.updateRoles(userId, editingRoles);
      success('User roles updated successfully.');
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      error(err.message || 'Failed to update user roles');
    }
  };

  // Handle Account Status Change
  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await adminApi.updateStatus(userId, { accountStatus: newStatus });
      success(`User account status updated to ${newStatus}.`);
      loadUsers();
    } catch (err) {
      error(err.message || 'Failed to update user status');
    }
  };

  // Handle Report Resolution
  const handleResolveReport = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setIsResolving(true);
    try {
      await moderationApi.resolveReport(selectedReport.id, {
        action: resolveAction,
        resolutionNote: resolutionNote.trim(),
      });
      success(resolveAction === 'DISMISS' ? 'Report dismissed.' : 'Report resolved.');
      setSelectedReport(null);
      setResolutionNote('');
      loadReports();
      loadStats();
    } catch (err) {
      error(err.message || 'Failed to resolve report');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="product-page admin-console-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <header className="admin-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                Platform Console
              </h1>
              <span className="cr-badge-orange" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                {isAdmin ? 'System Administrator' : 'Content Moderator'}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0', fontSize: '0.92rem' }}>
              Real-time platform analytics, user administration, and content moderation queue.
            </p>
          </div>

          <div className="admin-tab-nav" style={{ display: 'flex', gap: '0.5rem', background: 'var(--card-bg, #1e293b)', padding: '0.35rem', borderRadius: '10px' }}>
            {isAdmin && (
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                📊 Platform Stats
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                👥 User Management
              </button>
            )}
            <button
              type="button"
              className={`admin-tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
              onClick={() => setActiveTab('moderation')}
            >
              🛡️ Moderation Center
              {modStats?.pendingCount > 0 && (
                <span className="cr-badge-orange" style={{ marginLeft: '0.5rem', padding: '0.1rem 0.45rem', fontSize: '0.75rem' }}>
                  {modStats.pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* TAB 1: Platform Overview & Metrics */}
      {activeTab === 'stats' && isAdmin && (
        <section className="admin-stats-view">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div className="cr-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f47521' }}>
              <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Total Accounts</span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0.4rem 0 0', color: 'var(--text-primary)' }}>
                {adminStats?.totalUsers ?? '—'}
              </h2>
            </div>
            <div className="cr-card" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
              <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Active Creators</span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0.4rem 0 0', color: 'var(--text-primary)' }}>
                {adminStats?.activeCreators ?? '—'}
              </h2>
            </div>
            <div className="cr-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
              <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Pending Reports</span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0.4rem 0 0', color: '#ef4444' }}>
                {modStats?.pendingCount ?? 0}
              </h2>
            </div>
            <div className="cr-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
              <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Resolved Reports</span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0.4rem 0 0', color: '#10b981' }}>
                {modStats?.resolvedCount ?? 0}
              </h2>
            </div>
          </div>

          <div className="cr-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              ⚡ System Administration Quick Actions
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Switch to <strong>User Management</strong> to assign staff roles (Moderator / Admin) or manage creators.
              Switch to <strong>Moderation Center</strong> to review flagged novels, community updates, or user comments.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button type="button" className="cr-btn-primary" onClick={() => setActiveTab('users')}>
                👥 Open User Directory
              </button>
              <button type="button" className="cr-btn-secondary" onClick={() => setActiveTab('moderation')}>
                🛡️ Review Flagged Content
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: User Management */}
      {activeTab === 'users' && isAdmin && (
        <section className="admin-users-view">
          <div className="admin-filter-bar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by username or email…"
              value={userQuery}
              onChange={(e) => {
                setUserQuery(e.target.value);
                setUserPage(0);
              }}
              className="ig-comment-input"
              style={{ flex: 1, minWidth: '240px' }}
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setUserPage(0);
              }}
              className="ig-comment-input"
              style={{ minWidth: '150px' }}
            >
              <option value="">All Roles</option>
              <option value="USER">Users</option>
              <option value="MODERATOR">Moderators</option>
              <option value="ADMIN">Administrators</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setUserPage(0);
              }}
              className="ig-comment-input"
              style={{ minWidth: '150px' }}
            >
              <option value="">All Account Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
              <option value="PENDING_DELETION">Pending deletion</option>
              <option value="DELETED">Deleted</option>
            </select>
            <button type="button" className="cr-btn-secondary" onClick={loadUsers} style={{ padding: '0.5rem 1rem' }}>
              Refresh
            </button>
          </div>

          <div className="cr-card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>User</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Roles</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Creator</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{u.username}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {(u.roles || []).map((r) => (
                          <span
                            key={r}
                            className={r === 'ADMIN' ? 'cr-badge-orange' : 'cr-tag'}
                            style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem' }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: u.accountStatus === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: u.accountStatus === 'ACTIVE' ? '#10b981' : '#ef4444',
                        }}
                      >
                        {u.accountStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: u.creatorStatus === 'ACTIVE' ? '#3b82f6' : 'var(--text-muted)' }}>
                      {u.creatorStatus}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="cr-btn-secondary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedUser(u);
                            setEditingRoles([...(u.roles || ['READER'])]);
                          }}
                        >
                          Edit Roles
                        </button>
                        {u.accountStatus === 'ACTIVE' ? (
                          <button
                            type="button"
                            className="cr-btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#ef4444', borderColor: '#ef4444' }}
                            onClick={() => handleUpdateStatus(u.id, 'BLOCKED')}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="cr-btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#10b981', borderColor: '#10b981' }}
                            onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No users match the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* User Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {userPage + 1} of {totalUserPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="cr-btn-secondary"
                disabled={userPage <= 0}
                onClick={() => setUserPage((p) => p - 1)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              >
                Previous
              </button>
              <button
                type="button"
                className="cr-btn-secondary"
                disabled={userPage >= totalUserPages - 1}
                onClick={() => setUserPage((p) => p + 1)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              >
                Next
              </button>
            </div>
          </div>

          {/* Role Edit Modal */}
          {selectedUser && (
            <div className="cr-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
              <div className="cr-card" style={{ width: '90%', maxWidth: '480px', padding: '1.75rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem' }}>
                  Update Roles for @{selectedUser.username}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                  Select the permissions and roles to assign to this user:
                </p>
                <div style={{ display: 'grid', gap: '0.65rem', marginBottom: '1.5rem' }}>
                  {['USER', 'MODERATOR', 'ADMIN'].map((r) => {
                    const checked = editingRoles.includes(r);
                    return (
                      <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', background: checked ? 'rgba(244,117,33,0.1)' : 'transparent' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingRoles([...editingRoles, r]);
                            } else {
                              setEditingRoles(editingRoles.filter((item) => item !== r));
                            }
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>{r}</span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" className="cr-btn-secondary" onClick={() => setSelectedUser(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="cr-btn-primary"
                    disabled={editingRoles.length === 0}
                    onClick={() => handleUpdateRoles(selectedUser.id)}
                  >
                    Save Roles
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: Moderation Center */}
      {activeTab === 'moderation' && (
        <section className="admin-moderation-view">
          <div className="admin-filter-bar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <select
              value={reportStatusFilter}
              onChange={(e) => {
                setReportStatusFilter(e.target.value);
                setReportPage(0);
              }}
              className="ig-comment-input"
              style={{ minWidth: '160px' }}
            >
              <option value="PENDING">Pending Review</option>
              <option value="RESOLVED">Resolved Reports</option>
              <option value="DISMISSED">Dismissed Reports</option>
              <option value="">All Statuses</option>
            </select>
            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setReportPage(0);
              }}
              className="ig-comment-input"
              style={{ minWidth: '160px' }}
            >
              <option value="">All Content Types</option>
              <option value="NOVEL">Novel</option>
              <option value="CHAPTER">Chapter</option>
              <option value="COMMENT">Comment</option>
              <option value="POST">Community Post</option>
            </select>
            <button type="button" className="cr-btn-secondary" onClick={loadReports} style={{ padding: '0.5rem 1rem' }}>
              Refresh Queue
            </button>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="cr-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderLeft: rep.status === 'PENDING' ? '4px solid #ef4444' : '4px solid #10b981',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                    <span className="cr-badge-orange" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}>
                      {rep.targetType}
                    </span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {rep.targetTitle || `Target ID: ${rep.targetId}`}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      #{rep.id} • {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: '0.35rem 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    <strong>Reason:</strong> {rep.reason}
                  </p>
                  {rep.details && (
                    <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      "{rep.details}"
                    </p>
                  )}
                  {rep.resolutionNote && (
                    <div style={{ marginTop: '0.65rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.82rem' }}>
                      <strong>Resolution Note:</strong> {rep.resolutionNote}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: rep.status === 'PENDING' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                      color: rep.status === 'PENDING' ? '#ef4444' : '#10b981',
                    }}
                  >
                    {rep.status}
                  </span>
                  {rep.status === 'PENDING' && (
                    <button
                      type="button"
                      className="cr-btn-primary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
                      onClick={() => {
                        setSelectedReport(rep);
                        setResolveAction('RESOLVE');
                        setResolutionNote('');
                      }}
                    >
                      Take Action
                    </button>
                  )}
                </div>
              </div>
            ))}

            {reports.length === 0 && !loading && (
              <div className="cr-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                🎉 The moderation queue is clean! No reports match this filter.
              </div>
            )}
          </div>

          {/* Moderation Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {reportPage + 1} of {totalReportPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="cr-btn-secondary"
                disabled={reportPage <= 0}
                onClick={() => setReportPage((p) => p - 1)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              >
                Previous
              </button>
              <button
                type="button"
                className="cr-btn-secondary"
                disabled={reportPage >= totalReportPages - 1}
                onClick={() => setReportPage((p) => p + 1)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              >
                Next
              </button>
            </div>
          </div>

          {/* Resolve Action Modal */}
          {selectedReport && (
            <div className="cr-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
              <div className="cr-card" style={{ width: '90%', maxWidth: '520px', padding: '1.75rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem' }}>
                  Review Moderation Report
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                  Target: <strong>{selectedReport.targetType}</strong> ({selectedReport.targetTitle || 'Reported content'})
                  <br />
                  Reported for: <em>{selectedReport.reason}</em>
                </p>

                <form onSubmit={handleResolveReport}>
                  <label style={{ display: 'block', marginBottom: '1rem' }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      Resolution:
                    </span>
                    <select
                      className="ig-comment-input"
                      value={resolveAction}
                      onChange={(e) => setResolveAction(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="RESOLVE">Resolve report</option>
                      <option value="DISMISS">Dismiss Report (No Violation)</option>
                    </select>
                  </label>

                  <label style={{ display: 'block', marginBottom: '1.5rem' }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      Resolution Note / Justification:
                    </span>
                    <textarea
                      rows={3}
                      className="ig-composer-textarea"
                      placeholder="Add an internal note or rationale for this enforcement action…"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      required
                    />
                  </label>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="cr-btn-secondary"
                      onClick={() => setSelectedReport(null)}
                      disabled={isResolving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="cr-btn-primary"
                      disabled={isResolving || !resolutionNote.trim()}
                    >
                      {isResolving ? 'Resolving…' : 'Confirm Resolution'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
