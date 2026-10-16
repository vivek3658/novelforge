/**
 * User Profile & Creator Status Feature API
 * Communicates with Identity Service through the API Gateway.
 */

import { apiClient } from '../../../lib/api/client';
import { ENDPOINTS } from '../../../lib/api/endpoints';

export const profileApi = {
  /**
   * Get authenticated user's profile details.
   */
  getMyProfile: async () => {
    return apiClient(ENDPOINTS.PROFILE.ME, {
      method: 'GET',
    });
  },

  /**
   * Get public profile by user ID.
   */
  getProfileById: async (userId) => {
    return apiClient(ENDPOINTS.PROFILE.BY_ID(userId), {
      method: 'GET',
    });
  },

  /**
   * Update profile details (displayName, bio, visibility).
   */
  updateMyProfile: async ({ displayName, bio, visibility }) => {
    return apiClient(ENDPOINTS.PROFILE.ME, {
      method: 'PATCH',
      body: JSON.stringify({ displayName, bio, visibility }),
    });
  },

  /**
   * Activate creator status.
   */
  activateCreator: async () => {
    return apiClient(ENDPOINTS.PROFILE.ACTIVATE_CREATOR, {
      method: 'POST',
    });
  },

  /**
   * Deactivate creator status.
   */
  deactivateCreator: async () => {
    return apiClient(ENDPOINTS.PROFILE.DEACTIVATE_CREATOR, {
      method: 'POST',
    });
  },
};

export default profileApi;
