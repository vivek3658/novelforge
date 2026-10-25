# NovelForge HTTP API

All browser traffic goes through the API Gateway at `http://localhost:8080`. The gateway strips each `/api/v1/...` service prefix before forwarding the request. Requests that change user data require `Authorization: Bearer <access-token>`, except authentication and explicitly public read routes.

Paginated endpoints use zero-based `page` and `size` query parameters. Most list endpoints default to 20 items; Engagement and Novel cap pages at 100 items. API responses use Spring `Page` JSON (`content`, `number`, `size`, `totalElements`, `totalPages`, `last`).

## Service entry points

| Service | Gateway prefix | Container port |
|---|---|---:|
| Identity | `/api/v1/identity` | 8081 |
| Notification | `/api/v1/notifications` | 8082 |
| Novel | `/api/v1/novels` | 8083 |
| Engagement | `/api/v1/engagement` | 8084 |
| Studio | `/api/v1/studios` | 8087 |

The ports above are service-container ports. Docker Compose exposes the API Gateway to the host and keeps application services on its private network.

## Identity

All paths below start with `/api/v1/identity`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register/send-otp` | Public; gateway rate-limited | Send registration code |
| POST | `/register/verify-otp` | Public; gateway rate-limited | Verify registration code |
| POST | `/register` | Public | Create an account |
| POST | `/auth/login` | Public | Sign in; returns access token and refresh cookie |
| POST | `/auth/refresh` | Refresh cookie | Silently renew access token |
| POST | `/auth/logout` | Bearer token | End the session and clear refresh cookie |
| GET | `/auth/me` | Bearer token | Current account |
| POST | `/auth/forgot-password` | Public; gateway rate-limited | Start password reset |
| POST | `/auth/forgot-password/verify` | Public; gateway rate-limited | Verify reset code |
| POST | `/auth/forgot-password/reset` | Public | Set a new password after verification |
| GET | `/profile/me` | Bearer token | Current profile |
| GET | `/profile/{userId}` | Bearer token | Read a profile subject to profile visibility |
| PATCH | `/profile/me` | Bearer token | Update display name, bio, or visibility |
| POST | `/profile/creator` | Bearer token | Activate creator status |
| POST | `/profile/creator/deactivate` | Bearer token | Deactivate creator status |
| DELETE | `/account` | Bearer token | Request account deletion |
| POST | `/account/cancel-deletion` | Bearer token | Cancel pending deletion |

Internal Identity endpoints are not for browser clients. Creator eligibility requires `X-Internal-Service-Key`; OTP challenge validation requires `X-Internal-Client-Secret`. Each caller has its own configured credential.

## Studio

All paths start with `/api/v1/studios` and require a bearer token for user actions.

| Method | Path | Purpose |
|---|---|---|
| POST | `/studios` | Create a studio |
| GET | `/studios?page=0&size=20` | List studios available to the current user |
| GET | `/studios/{studioId}` | Read studio details |
| PUT | `/studios/{studioId}` | Update studio details with the required permission |
| DELETE | `/studios/{studioId}` | Soft-delete a studio |
| POST | `/studios/{studioId}/deletion/cancel` | Cancel studio deletion |
| POST | `/studios/{studioId}/members` | Invite/add a studio member |
| POST | `/studios/invitations/{membershipId}/accept` | Accept a membership invitation |
| PATCH | `/studios/{studioId}/members/{memberUserId}/role` | Change a member's role/permission set |
| DELETE | `/studios/{studioId}/members/{memberUserId}` | Remove a member |
| GET | `/studios/{studioId}/members?page=0&size=20` | List studio members |

`GET /studios/{studioId}/members/me` is an internal membership check. It requires both the acting user's bearer token and the caller-specific `X-Internal-Service-Key` used by Novel or Engagement. Studio permissions—not role names—authorize operations.

## Novel and Chapters

Public novel and chapter reads use `/api/v1/novels`. Studio authoring routes use the same prefix and require a bearer token plus the required Studio permission.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/novels/search?query=&category=&genre=&tag=&page=0&size=20` | Public | Search published novels |
| GET | `/novels/{novelId}` | Public | Read published novel details |
| GET | `/novels/{novelId}/chapters?page=0&size=20` | Public | List published chapters |
| GET | `/novels/{novelId}/chapters/{chapterId}` | Public | Read a full chapter and ordered content blocks |
| POST | `/studios/{studioId}/novels` | Bearer + Studio permission | Create a studio novel |
| GET | `/studios/{studioId}/novels?page=0&size=20` | Bearer + Studio membership | List studio novels, including drafts |
| GET | `/studios/{studioId}/novels/{novelId}` | Bearer + Studio membership | Read a studio novel/draft |
| PUT | `/novels/{novelId}` | Bearer + Studio permission | Update novel metadata |
| DELETE | `/novels/{novelId}` | Bearer + Studio permission | Soft-delete a novel |
| POST | `/novels/{novelId}/deletion/cancel` | Bearer + Studio permission | Cancel novel deletion |
| POST | `/novels/{novelId}/publish` | Bearer + Studio permission | Publish a novel |
| POST | `/novels/{novelId}/chapters` | Bearer + Studio permission | Create a draft chapter |
| GET | `/studios/{studioId}/novels/{novelId}/chapters?page=0&size=20` | Bearer + Studio membership | List studio chapters, including drafts |
| GET | `/studios/{studioId}/novels/{novelId}/chapters/{chapterId}` | Bearer + Studio membership | Read an editable chapter draft |
| PATCH | `/novels/{novelId}/chapters/{chapterId}` | Bearer + Studio permission | Update chapter metadata |
| DELETE | `/novels/{novelId}/chapters/{chapterId}` | Bearer + Studio permission | Soft-delete a chapter |
| POST | `/novels/{novelId}/chapters/{chapterId}/blocks` | Bearer + Studio permission | Add a text/image content block |
| PUT | `/novels/{novelId}/chapters/{chapterId}/blocks/{blockId}` | Bearer + Studio permission | Update a content block |
| DELETE | `/novels/{novelId}/chapters/{chapterId}/blocks/{blockId}` | Bearer + Studio permission | Remove a content block |
| POST | `/novels/{novelId}/chapters/{chapterId}/publish` | Bearer + Studio permission | Publish a chapter now |
| POST | `/novels/{novelId}/chapters/{chapterId}/schedule` | Bearer + Studio permission | Schedule chapter publication |
| DELETE | `/novels/{novelId}/chapters/{chapterId}/schedule` | Bearer + Studio permission | Cancel scheduled publication |

Novel's public detail and chapter responses are Redis-cached. Studio editing reads bypass the public cache. Chapter content uses MongoDB; novel metadata and lifecycle state use PostgreSQL.

## Engagement, Feed, and Library

All paths start with `/api/v1/engagement`. Protected routes require a bearer token. `type` values are `CREATOR` or `STUDIO` for follows, and `NOVEL`, `CHAPTER`, or `POST` for likes/comments. Chapter target IDs use `novelId:chapterId`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| PUT | `/follows/{CREATOR\|STUDIO}/{targetId}` | Bearer | Follow a creator or studio |
| DELETE | `/follows/{CREATOR\|STUDIO}/{targetId}` | Bearer | Unfollow |
| GET | `/follows/me` | Bearer | List followed targets |
| GET | `/follows/{type}/{targetId}/count` | Public | Get follower count |
| POST | `/targets/{type}/{targetId}/likes` | Bearer | Like a novel, chapter, or post |
| DELETE | `/targets/{type}/{targetId}/likes` | Bearer | Remove a like |
| GET | `/targets/{type}/{targetId}/likes/count` | Public | Get like count |
| POST | `/targets/{type}/{targetId}/comments` | Bearer | Add a flat comment |
| GET | `/targets/{type}/{targetId}/comments?page=0&size=20` | Public | List comments |
| PUT | `/comments/{commentId}` | Bearer; comment owner | Edit a comment |
| DELETE | `/comments/{commentId}` | Bearer; comment owner | Soft-delete a comment |
| POST | `/posts` | Bearer; creator or Studio permission | Create a text/image post with tags |
| GET | `/public/posts?page=0&size=20` | Public | Browse posts |
| GET | `/public/posts/{postId}` | Public | Read a post |
| PUT | `/posts/{postId}` | Bearer; post author | Edit a post |
| DELETE | `/posts/{postId}` | Bearer; post author | Soft-delete a post |
| POST | `/posts/{postId}/shares` | Bearer | Share a post |
| DELETE | `/posts/{postId}/shares` | Bearer | Remove a share |
| GET | `/posts/{postId}/shares/count` | Public | Get share count |
| GET | `/feed?cursor=&size=20` | Bearer | Read the cursor-paginated personalized feed |
| GET | `/collections` | Bearer | List the user's collections (creates Watch later on first access) |
| POST | `/collections` | Bearer | Create a collection: `{ "name": "...", "description": "..." }` |
| PUT | `/collections/{collectionId}` | Bearer; owner | Rename/update a collection |
| DELETE | `/collections/{collectionId}` | Bearer; owner | Soft-delete a collection |
| GET | `/collections/{collectionId}/items?page=0&size=20` | Bearer; owner | List saved novels/chapters |
| PUT | `/collections/{collectionId}/items` | Bearer; owner | Save item: `{ "targetType": "NOVEL", "targetId": "123" }` |
| DELETE | `/collections/{collectionId}/items/{itemId}` | Bearer; owner | Remove a saved item |
| GET | `/collections/watch-later` | Bearer | Get the default Watch later collection |
| GET | `/collections/watch-later/contains?targetType=NOVEL&targetId=123` | Bearer | Check whether a novel/chapter is saved |
| PUT | `/collections/watch-later/items` | Bearer | Save to Watch later using the same item body |
| DELETE | `/collections/watch-later/items?targetType=NOVEL&targetId=123` | Bearer | Remove from Watch later |

Feed fanout is delivered asynchronously through RabbitMQ and made idempotent by database constraints. The Watch later collection is system-managed and cannot be renamed or deleted. Collections currently accept novels and chapters, not posts.

## Notification

Browser clients should use Identity's OTP routes. Notification's email endpoint and Identity challenge-validation endpoint are service-to-service APIs and are protected with internal credentials. RabbitMQ uses broker credentials; email delivery is asynchronous.

## Internal service authentication

| Caller | Target | Credential |
|---|---|---|
| Studio | Identity creator eligibility | `STUDIO_IDENTITY_INTERNAL_SECRET` in `X-Internal-Service-Key` |
| Engagement | Identity creator eligibility | `ENGAGEMENT_IDENTITY_INTERNAL_SECRET` in `X-Internal-Service-Key` |
| Notification | Identity OTP challenge validation | `NOTIFICATION_IDENTITY_INTERNAL_SECRET` in `X-Internal-Client-Secret` |
| Novel | Studio membership check | `NOVEL_STUDIO_INTERNAL_SECRET` in `X-Internal-Service-Key` |
| Engagement | Studio membership check | `ENGAGEMENT_STUDIO_INTERNAL_SECRET` in `X-Internal-Service-Key` |

Novel's public content checks do not use an internal credential because those read endpoints are intentionally public. Configure independent random secret values in the local ignored `.env` and in each deployment environment; never commit actual secrets.
