import authApi, {
  getBaseUrl,
  setBaseUrl,
  resetBaseUrl,
  apiRequest,
  novelApi,
  healthApi,
  SERVICES_CONFIG,
  normalizeUrl,
  resolveEndpoint,
} from './services/api';

export const buildApiUrl = (path) => `${getBaseUrl()}${path}`;
export const API_BASE_URL = getBaseUrl();

export {
  authApi,
  novelApi,
  healthApi,
  SERVICES_CONFIG,
  getBaseUrl,
  setBaseUrl,
  resetBaseUrl,
  apiRequest,
  normalizeUrl,
  resolveEndpoint,
};

export default authApi;
