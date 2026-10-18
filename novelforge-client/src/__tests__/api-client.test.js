import { describe, it, expect } from 'vitest';
import {
  normalizeBaseUrl,
  validateApiConfiguration,
} from '../lib/api/client';
import { resolveEndpoint, ENDPOINTS } from '../lib/api/endpoints';
import {
  normalizeError,
  ApiError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  TimeoutError,
  NetworkError,
  maskSensitiveData,
} from '../lib/api/errors';

describe('Centralized API Architecture & Base URL', () => {
  it('normalizes base URLs by stripping trailing slashes and redundant /api/v1', () => {
    expect(normalizeBaseUrl('http://localhost:8080/')).toBe('http://localhost:8080');
    expect(normalizeBaseUrl('http://localhost:8080/api/v1')).toBe('http://localhost:8080');
    expect(normalizeBaseUrl('https://api.novelforge.com/api/v1/')).toBe('https://api.novelforge.com');
    expect(normalizeBaseUrl('')).toBe('');
  });

  it('rejects prohibited direct microservice URLs as required by architecture', () => {
    import.meta.env.VITE_IDENTITY_SERVICE_URL = 'http://localhost:8081';
    expect(() => validateApiConfiguration()).toThrow(/Prohibited microservice URLs detected/);

    delete import.meta.env.VITE_IDENTITY_SERVICE_URL;
    expect(() => validateApiConfiguration()).not.toThrow();

    import.meta.env.VITE_NOVEL_SERVICE_URL = 'http://localhost:8082';
    expect(() => validateApiConfiguration()).toThrow(/Prohibited microservice URLs detected/);

    // Restore
    delete import.meta.env.VITE_NOVEL_SERVICE_URL;
  });

  it('resolves endpoints through the API Gateway prefixes correctly', () => {
    // Identity routes
    expect(resolveEndpoint('/auth/login')).toBe('/api/v1/identity/auth/login');
    expect(resolveEndpoint('auth/me')).toBe('/api/v1/identity/auth/me');
    expect(resolveEndpoint('/register')).toBe('/api/v1/identity/register');
    expect(resolveEndpoint('/profile/me')).toBe('/api/v1/identity/profile/me');
    expect(resolveEndpoint('/account')).toBe('/api/v1/identity/account');

    // Studio routes
    expect(resolveEndpoint('/studios')).toBe('/api/v1/studios');
    expect(resolveEndpoint('/studios/42')).toBe('/api/v1/studios/42');

    // Novel routes
    expect(resolveEndpoint('/novels')).toBe('/api/v1/novels');
    expect(resolveEndpoint('/novels/1')).toBe('/api/v1/novels/1');

    // Already gateway prefixed
    expect(resolveEndpoint('/api/v1/identity/auth/login')).toBe('/api/v1/identity/auth/login');
    expect(resolveEndpoint('/api/v1/novels')).toBe('/api/v1/novels');
  });

  it('matches all declared ENDPOINTS to gateway routes', () => {
    expect(ENDPOINTS.AUTH.LOGIN).toBe('/api/v1/identity/auth/login');
    expect(ENDPOINTS.AUTH.REFRESH).toBe('/api/v1/identity/auth/refresh');
    expect(ENDPOINTS.STUDIOS.BASE).toBe('/api/v1/studios');
    expect(ENDPOINTS.NOVELS.BASE).toBe('/api/v1/novels');
  });
});

describe('Error Normalization & Security', () => {
  it('normalizes 401 Unauthorized to AuthError', () => {
    const err = normalizeError(null, { message: 'Invalid credentials' }, 401);
    expect(err).toBeInstanceOf(AuthError);
    expect(err.status).toBe(401);
    expect(err.message).toBe('Invalid credentials');
  });

  it('normalizes 403 Forbidden to ForbiddenError', () => {
    const err = normalizeError(null, { message: 'Access denied' }, 403);
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.status).toBe(403);
  });

  it('normalizes 404 Not Found to NotFoundError', () => {
    const err = normalizeError(null, { message: 'Novel not found' }, 404);
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.status).toBe(404);
  });

  it('normalizes 400 Bad Request to ValidationError', () => {
    const err = normalizeError(null, { message: 'Invalid input', errors: { title: 'Required' } }, 400);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.status).toBe(400);
    expect(err.fieldErrors).toEqual({ title: 'Required' });
  });

  it('normalizes 500+ to user-friendly server error message', () => {
    const err = normalizeError(null, 'Internal Server Error', 500);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(500);
    expect(err.message).toContain('temporarily unavailable');
  });

  it('normalizes AbortError to TimeoutError', () => {
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';
    const err = normalizeError(abortErr);
    expect(err).toBeInstanceOf(TimeoutError);
    expect(err.status).toBe(408);
  });

  it('normalizes network TypeError to NetworkError', () => {
    const netErr = new TypeError('Failed to fetch');
    const err = normalizeError(netErr);
    expect(err).toBeInstanceOf(NetworkError);
    expect(err.status).toBe(0);
  });

  it('masks sensitive fields such as passwords and tokens in logs', () => {
    const payload = {
      username: 'author_1',
      password: 'SuperSecretPassword123!',
      token: 'jwt.token.here',
      otp: '123456',
      metadata: {
        accessToken: 'access.secret',
      },
    };

    const masked = maskSensitiveData(payload);
    expect(masked.username).toBe('author_1');
    expect(masked.password).toBe('***MASKED***');
    expect(masked.token).toBe('***MASKED***');
    expect(masked.otp).toBe('***MASKED***');
    expect(masked.metadata.accessToken).toBe('***MASKED***');
  });
});
