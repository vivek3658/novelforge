import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authApi } from '../features/auth/api/auth.api';

describe('Authentication Feature API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs login via POST /api/v1/identity/auth/login', async () => {
    const mockResponse = {
      userId: 1,
      username: 'novel_author',
      accessToken: 'header.payload.signature',
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    });

    const result = await authApi.login({ identifier: 'novel_author', password: 'Password123!' });
    expect(result).toEqual(mockResponse);

    const [calledUrl, options] = globalThis.fetch.mock.calls[0];
    expect(calledUrl).toContain('/api/v1/identity/auth/login');
    expect(options.method).toBe('POST');
    expect(options.credentials).toBe('include');
    expect(JSON.parse(options.body)).toEqual({
      identifier: 'novel_author',
      password: 'Password123!',
    });
  });

  it('performs refresh token via POST /api/v1/identity/auth/refresh with HttpOnly cookie', async () => {
    const mockRefresh = {
      userId: 1,
      username: 'novel_author',
      accessToken: 'new.refreshed.token',
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockRefresh,
    });

    const result = await authApi.refreshToken();
    expect(result).toEqual(mockRefresh);

    const [calledUrl, options] = globalThis.fetch.mock.calls[0];
    expect(calledUrl).toContain('/api/v1/identity/auth/refresh');
    expect(options.method).toBe('POST');
    expect(options.credentials).toBe('include');
  });

  it('fetches /me via GET /api/v1/identity/auth/me with Bearer token', async () => {
    const mockUser = {
      id: 1,
      username: 'novel_author',
      email: 'author@novelforge.com',
      roles: ['USER', 'CREATOR'],
      emailVerified: true,
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockUser,
    });

    const result = await authApi.getMe('test-token');
    expect(result).toEqual(mockUser);

    const [calledUrl, options] = globalThis.fetch.mock.calls[0];
    expect(calledUrl).toContain('/api/v1/identity/auth/me');
    expect(options.method).toBe('GET');
    expect(options.headers['Authorization']).toBe('Bearer test-token');
  });

  it('performs logout via POST /api/v1/identity/auth/logout', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    const result = await authApi.logout();
    expect(result).toEqual({ success: true });

    const [calledUrl, options] = globalThis.fetch.mock.calls[0];
    expect(calledUrl).toContain('/api/v1/identity/auth/logout');
    expect(options.method).toBe('POST');
    expect(options.credentials).toBe('include');
  });
});
