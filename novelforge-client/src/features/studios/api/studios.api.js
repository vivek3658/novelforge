/**
 * Studio & Creator Collaboration Feature API
 * Fully synchronized with Studio Service endpoints behind the API Gateway.
 */

import { apiClient } from '../../../lib/api/client';
import { ENDPOINTS } from '../../../lib/api/endpoints';

export const studioApi = {
  /**
   * Create a new collaborative Studio workspace.
   * Requires an active Creator status.
   * Payload: { studioName: string, studioHandle: string }
   */
  createStudio: async ({ studioName, studioHandle }) => {
    return apiClient(ENDPOINTS.STUDIOS.BASE, {
      method: 'POST',
      body: JSON.stringify({ studioName, studioHandle }),
    });
  },

  /**
   * Update studio metadata.
   * Payload: { studioName: string }
   */
  updateStudio: async (studioId, { studioName }) => {
    return apiClient(ENDPOINTS.STUDIOS.DETAIL(studioId), {
      method: 'PUT',
      body: JSON.stringify({ studioName }),
    });
  },

  /**
   * Request studio deletion (Owner only).
   */
  requestDeletion: async (studioId) => {
    return apiClient(ENDPOINTS.STUDIOS.REQUEST_DELETION(studioId), {
      method: 'DELETE',
    });
  },

  /**
   * Cancel pending studio deletion.
   */
  cancelDeletion: async (studioId) => {
    return apiClient(ENDPOINTS.STUDIOS.CANCEL_DELETION(studioId), {
      method: 'POST',
    });
  },

  /**
   * Retrieve studio workspace details.
   */
  getStudio: async (studioId) => {
    return apiClient(ENDPOINTS.STUDIOS.DETAIL(studioId), {
      method: 'GET',
    });
  },

  /**
   * Search / list studios with pagination.
   */
  searchStudios: async ({ query = '', page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams({
      query,
      page: String(page),
      size: String(size),
    });
    return apiClient(`${ENDPOINTS.STUDIOS.BASE}?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * Invite a collaborator to the studio.
   * Payload: { inviteeUserId: number, role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'CONTRIBUTOR' | 'PROOFREADER' }
   */
  inviteMember: async (studioId, { inviteeUserId, role = 'EDITOR' }) => {
    return apiClient(ENDPOINTS.STUDIOS.MEMBERS(studioId), {
      method: 'POST',
      body: JSON.stringify({ inviteeUserId, role }),
    });
  },

  /**
   * Accept an invitation to join a studio team.
   */
  acceptInvitation: async (membershipId) => {
    return apiClient(ENDPOINTS.STUDIOS.ACCEPT_INVITATION(membershipId), {
      method: 'POST',
    });
  },

  /**
   * Update a studio member's role.
   */
  updateMemberRole: async (studioId, memberUserId, { role }) => {
    return apiClient(ENDPOINTS.STUDIOS.MEMBER_ROLE(studioId, memberUserId), {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  /**
   * Remove a member from a studio team.
   */
  removeMember: async (studioId, memberUserId) => {
    return apiClient(ENDPOINTS.STUDIOS.REMOVE_MEMBER(studioId, memberUserId), {
      method: 'DELETE',
    });
  },

  /**
   * List paginated members of a studio.
   */
  getMembers: async (studioId, { page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    return apiClient(`${ENDPOINTS.STUDIOS.MEMBERS(studioId)}?${params.toString()}`, {
      method: 'GET',
    });
  },
};

export default studioApi;
