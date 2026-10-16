import authApi, {
  getBaseUrl,
  getApiBaseUrl,
  apiRequest,
  apiClient,
  novelApi,
  profileApi,
  accountApi,
  studioApi,
  chaptersApi,
  engagementApi,
  imageKitConfig,
  normalizeUrl,
  normalizeBaseUrl,
  resolveEndpoint,
  ENDPOINTS,
  STORAGE_TOKEN_KEY,
} from './services/api';

export const buildApiUrl = (path) => `${getBaseUrl()}${resolveEndpoint(path)}`;
export const API_BASE_URL = getBaseUrl();

export {
  authApi,
  novelApi,
  profileApi,
  accountApi,
  studioApi,
  chaptersApi,
  engagementApi,
  imageKitConfig,
  getBaseUrl,
  getApiBaseUrl,
  apiRequest,
  apiClient,
  normalizeUrl,
  normalizeBaseUrl,
  resolveEndpoint,
  ENDPOINTS,
  STORAGE_TOKEN_KEY,
};

export default authApi;
