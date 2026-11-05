# NovelForge Frontend and Backend Contract

Verified 2026-11-05 against `novelforge-client/src`, the backend controllers/DTOs, and [API.md](../../API.md). `API.md` is the canonical endpoint catalog; this page records the client-specific behavior and important boundaries.

## Client architecture

- React 19 JSX, Vite, and React Router 7.
- Browser requests go through `src/services/api.js` to the API Gateway; the shared client attaches the bearer token and handles one eligible refresh retry.
- `VITE_API_BASE_URL` defaults to `http://localhost:8080`.
- The client uses local component/context state and the existing shared UI components. It does not use TypeScript, Axios, TanStack Query, Zustand, or Tailwind.

## Gateway and service ownership

| Browser prefix | Owner | Notes |
|---|---|---|
| `/api/v1/identity/**` | `identity-service` | Auth, accounts, profile, creator lifecycle, user search |
| `/api/v1/admin/**`, `/api/v1/moderation/**` | `identity-service` | Admin and moderation are API areas, not separate services |
| `/api/v1/novels/**` | `novel-service` | Public catalog and authoring; studio-scoped novel routes are rewritten by the gateway |
| `/api/v1/studios/**` | `studio-service` | Studios, permissions, membership, invitations |
| `/api/v1/engagement/**` | `engagement-service` | Social actions, posts, feed, follows, and collections |
| No browser prefix | `notification-service` | Internal RabbitMQ consumer for OTP email; not an inbox API |

## Relevant client contracts

- Studio user search: `GET /api/v1/identity/users/search?q=&limit=10`; only public-safe user fields are returned.
- Studio invite creation: `POST /api/v1/studios/{studioId}/members`; the server checks owner permission, invitee eligibility, and membership state.
- Invitation inbox: `GET /api/v1/studios/invitations/me`; the authenticated recipient receives pending invitations to active studios with membership ID (used internally for actions), studio name/handle, role, invitation time, and nullable `readAt`.
- Invitation read state: `PATCH /api/v1/studios/invitations/{membershipId}/read`; only the invitee can mark their pending invitation as read.
- Invitation acceptance: `POST /api/v1/studios/invitations/{membershipId}/accept`; server verifies the invitation belongs to the caller and updates its persisted membership status.
- Novel metadata update: `PUT /api/v1/novels/novels/{novelId}` at the gateway, rewritten to the Novel service's `/novels/{novelId}` controller. Body fields match `NovelRequestDto`: `title`, `synopsis`, `coverImageUrl`, `categoryType`, `genres`, and `tags`.
- Profile update: `PATCH /api/v1/identity/profile/me` accepts username, display name, bio, visibility, and ImageKit profile/banner URLs. Profile image bytes upload directly to ImageKit using the authenticated one-time signature; only the resulting URL is sent to Identity. A successful username change requires signing in again because existing JWT claims contain the previous username.
- Studio chapter authoring: the client loads drafts through the studio-scoped chapter reads, creates a draft through `POST /api/v1/novels/novels/{novelId}/chapters`, and mutates metadata/content through the documented chapter and block routes in `API.md`.

## Client routes and known limits

The chapter writer is a workspace within `/studio`, not a separate URL. The chapter list and new-chapter action are shown on entry; selecting an item loads its draft. The client build and lint validate this UI, but browser-level create/select/update behavior still needs an end-to-end smoke test against a running backend.

`/admin` and `/moderation` are protected client routes and depend on backend authorization. Report resolution currently records triage but does not remove content or suspend accounts. Comment responses still lack public author profile fields; see the open gaps in [BACKEND_GAPS.md](../../docs/BACKEND_GAPS.md).

The Inbox lists persisted studio membership invitations via `GET /api/v1/studios/invitations/me`, displays unread invitations, supports marking them read, and accepts through the Studio API. The separate notification service remains an OTP email consumer; it does not provide a general notification feed.
