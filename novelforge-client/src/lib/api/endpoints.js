/**
 * Centralized API Gateway Route Definitions
 *
 * Rule: All client requests route exclusively through the API Gateway (VITE_API_BASE_URL).
 * Never directly address individual microservices.
 */

export const ENDPOINTS = {
  // Identity Service routes (mounted behind gateway at /api/v1/identity)
  AUTH: {
    LOGIN: '/api/v1/identity/auth/login',
    REFRESH: '/api/v1/identity/auth/refresh',
    ME: '/api/v1/identity/auth/me',
    LOGOUT: '/api/v1/identity/auth/logout',
    FORGOT_PASSWORD: '/api/v1/identity/auth/forgot-password',
    FORGOT_PASSWORD_VERIFY: '/api/v1/identity/auth/forgot-password/verify',
    FORGOT_PASSWORD_RESET: '/api/v1/identity/auth/forgot-password/reset',
  },
  REGISTRATION: {
    SEND_OTP: '/api/v1/identity/register/send-otp',
    VERIFY_OTP: '/api/v1/identity/register/verify-otp',
    REGISTER: '/api/v1/identity/register',
  },
  PROFILE: {
    ME: '/api/v1/identity/profile/me',
    BY_ID: (userId) => `/api/v1/identity/profile/${userId}`,
    ACTIVATE_CREATOR: '/api/v1/identity/profile/creator',
    DEACTIVATE_CREATOR: '/api/v1/identity/profile/creator/deactivate',
  },
  ACCOUNT: {
    REQUEST_DELETION: '/api/v1/identity/account',
    CANCEL_DELETION: '/api/v1/identity/account/cancel-deletion',
  },

  // Studio Service routes (mounted behind gateway at /api/v1/studios or direct fallback /studios)
  STUDIOS: {
    BASE: '/api/v1/studios',
    DETAIL: (studioId) => `/api/v1/studios/${studioId}`,
    REQUEST_DELETION: (studioId) => `/api/v1/studios/${studioId}`,
    CANCEL_DELETION: (studioId) => `/api/v1/studios/${studioId}/deletion/cancel`,
    MEMBERS: (studioId) => `/api/v1/studios/${studioId}/members`,
    MEMBER_ROLE: (studioId, memberUserId) => `/api/v1/studios/${studioId}/members/${memberUserId}/role`,
    REMOVE_MEMBER: (studioId, memberUserId) => `/api/v1/studios/${studioId}/members/${memberUserId}`,
    ACCEPT_INVITATION: (membershipId) => `/api/v1/studios/invitations/${membershipId}/accept`,
  },

  // Novel Service routes (mounted behind gateway at /api/v1/novels)
  NOVELS: {
    BASE: '/api/v1/novels',
    DETAIL: (novelId) => `/api/v1/novels/${novelId}`,
    SEARCH: '/api/v1/novels/search',
  },

  ENGAGEMENT: {
    BASE: '/api/v1/engagement',
    COLLECTIONS: '/api/v1/engagement/collections',
    WATCH_LATER: '/api/v1/engagement/collections/watch-later',
    COLLECTION_ITEMS: (id) => `/api/v1/engagement/collections/${id}/items`,
    WATCH_LATER_ITEMS: '/api/v1/engagement/collections/watch-later/items',
    PUBLIC_POSTS: '/api/v1/engagement/public/posts',
    FEED: '/api/v1/engagement/feed',
  },

  // Notification Service routes (mounted behind gateway at /api/v1/notifications)
  NOTIFICATIONS: {
    BASE: '/api/v1/notifications',
    EMAIL: '/api/v1/notifications/email',
  },
};

/**
 * Resolves any relative or legacy endpoint into a clean gateway-routed path.
 * Ensures consistent `/api/v1/...` prefixing without duplicate prefixes.
 */
export function resolveEndpoint(path) {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  // Already prefixed with gateway /api/v1/
  if (normalized.startsWith('/api/v1/')) {
    return normalized;
  }

  // Identity Service short-paths
  if (
    normalized.startsWith('/auth') ||
    normalized.startsWith('/register') ||
    normalized.startsWith('/profile') ||
    normalized.startsWith('/account')
  ) {
    return `/api/v1/identity${normalized}`;
  }

  // Studio Service short-paths
  if (normalized.startsWith('/studios')) {
    return `/api/v1${normalized}`;
  }

  // Novel Service short-paths
  if (normalized.startsWith('/novels')) {
    return `/api/v1${normalized}`;
  }

  if (normalized.startsWith('/engagement') || normalized.startsWith('/collections') || normalized.startsWith('/follows') || normalized.startsWith('/targets') || normalized.startsWith('/posts') || normalized.startsWith('/feed') || normalized.startsWith('/public/posts')) {
    return `/api/v1/engagement${normalized}`;
  }

  // Notification Service short-paths
  if (normalized.startsWith('/notifications') || normalized.startsWith('/email')) {
    return `/api/v1${normalized}`;
  }

  return normalized;
}
