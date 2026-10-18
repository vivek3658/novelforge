import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { studioApi } from '../features/studios/api/studios.api';

describe('Studio Feature API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates studio using POST /api/v1/studios', async () => {
    const mockStudio = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      studioName: 'Dragon Quill',
      studioHandle: 'dragon-quill',
      createdAt: new Date().toISOString(),
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockStudio,
    });

    const result = await studioApi.createStudio({
      studioName: 'Dragon Quill',
      studioHandle: 'dragon-quill',
    });

    expect(result).toEqual(mockStudio);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [calledUrl, options] = globalThis.fetch.mock.calls[0];
    expect(calledUrl).toContain('/api/v1/studios');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      studioName: 'Dragon Quill',
      studioHandle: 'dragon-quill',
    });
  });

  it('searches studios with query parameters using GET /api/v1/studios', async () => {
    const mockPage = {
      content: [{ id: '1', studioName: 'Quill Studio', studioHandle: 'quill' }],
      totalElements: 1,
      totalPages: 1,
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockPage,
    });

    const result = await studioApi.searchStudios({ query: 'quill', page: 0, size: 10 });
    expect(result).toEqual(mockPage);

    const [calledUrl] = globalThis.fetch.mock.calls[0];
    expect(calledUrl).toContain('/api/v1/studios?query=quill&page=0&size=10');
  });

  it('invites a member using POST /api/v1/studios/:studioId/members', async () => {
    const studioId = '550e8400-e29b-41d4-a716-446655440000';
    const mockMembership = {
      id: 101,
      userId: 42,
      role: 'EDITOR',
      status: 'INVITED',
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockMembership,
    });

    const result = await studioApi.inviteMember(studioId, { inviteeUserId: 42, role: 'EDITOR' });
    expect(result).toEqual(mockMembership);

    const [calledUrl, options] = globalThis.fetch.mock.calls[0];
    expect(calledUrl).toContain(`/api/v1/studios/${studioId}/members`);
    expect(options.method).toBe('POST');
  });

  it('removes member using DELETE /api/v1/studios/:studioId/members/:memberUserId', async () => {
    const studioId = '550e8400-e29b-41d4-a716-446655440000';
    const memberUserId = 42;

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    const result = await studioApi.removeMember(studioId, memberUserId);
    expect(result).toEqual({ success: true });

    const [calledUrl, options] = globalThis.fetch.mock.calls[0];
    expect(calledUrl).toContain(`/api/v1/studios/${studioId}/members/${memberUserId}`);
    expect(options.method).toBe('DELETE');
  });
});
