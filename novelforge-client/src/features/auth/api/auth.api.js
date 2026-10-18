/**
 * Identity & Authentication Feature API
 * Communicates with Identity Service through the API Gateway.
 */

import { apiClient } from '../../../lib/api/client';
import { ENDPOINTS } from '../../../lib/api/endpoints';

export const authApi = {
  /**
   * Log in with username or email + password.
   * Server returns LoginResponseDto { userId, username, accessToken } and sets HttpOnly refreshToken cookie.
   */
  login: async ({ identifier, password }) => {
    return apiClient(ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  /**
   * Explicit refresh token call using HttpOnly cookie.
   */
  refreshToken: async () => {
    return apiClient(ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
    });
  },

  /**
   * Fetch current authenticated user info (/auth/me).
   */
  getMe: async (token) => {
    return apiClient(ENDPOINTS.AUTH.ME, {
      method: 'GET',
      token,
    });
  },

  /**
   * Log out session. Clears HttpOnly cookie on backend.
   */
  logout: async () => {
    return apiClient(ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
  },

  /**
   * Step 1: Send registration OTP to email address.
   */
  sendRegisterOtp: async (email) => {
    return apiClient(ENDPOINTS.REGISTRATION.SEND_OTP, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Step 2: Verify registration OTP.
   */
  verifyRegisterOtp: async (email, otp) => {
    return apiClient(ENDPOINTS.REGISTRATION.VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  /**
   * Step 3: Complete registration.
   */
  register: async ({ email, username, password, profileImageName, bannerImageName, profileVisibility }) => {
    return apiClient(ENDPOINTS.REGISTRATION.REGISTER, {
      method: 'POST',
      body: JSON.stringify({
        email,
        username,
        password,
        profileImageName,
        bannerImageName,
        profileVisibility,
      }),
    });
  },

  /**
   * Forgot Password: Request OTP.
   */
  forgotPasswordSendOtp: async (email) => {
    return apiClient(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Forgot Password: Verify OTP.
   */
  forgotPasswordVerifyOtp: async (email, otp) => {
    return apiClient(ENDPOINTS.AUTH.FORGOT_PASSWORD_VERIFY, {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  /**
   * Forgot Password: Reset password with verified email.
   */
  forgotPasswordReset: async (email, newPassword) => {
    return apiClient(ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET, {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  },
};

export default authApi;
