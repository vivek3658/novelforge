/**
 * Account Lifecycle Feature API
 * Communicates with Identity Service through the API Gateway.
 */

import { apiClient } from '../../../lib/api/client';
import { ENDPOINTS } from '../../../lib/api/endpoints';

export const accountApi = {
  /**
   * Request account deletion (enters 30-day pending deletion grace period).
   */
  requestDeletion: async () => {
    return apiClient(ENDPOINTS.ACCOUNT.REQUEST_DELETION, {
      method: 'DELETE',
    });
  },

  /**
   * Cancel pending account deletion and restore active account status.
   */
  cancelDeletion: async () => {
    return apiClient(ENDPOINTS.ACCOUNT.CANCEL_DELETION, {
      method: 'POST',
    });
  },
};

export default accountApi;
