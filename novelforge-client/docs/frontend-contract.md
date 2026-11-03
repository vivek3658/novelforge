# NovelForge Frontend-Backend API & Architecture Contract

> **Document Version:** 1.0.0  
> **Backend Source Revision:** October 2026  
> **Source of Truth:** Spring Boot microservice controllers, security filters, DTOs, entity records, and API Gateway route configurations.

---

## 1. System Architecture & Gateway Routing

All browser traffic communicates through the **API Gateway** on port `8080` (or `VITE_API_BASE_URL`). The gateway rewrites and routes requests to downstream microservices:

| Service | Gateway Prefix | Real Service Path | Auth Mechanism |
|---|---|---|---|
| **Identity Service** | `/api/v1/identity` | `/...` | Public, Bearer JWT, or Refresh Cookie |
| **Studio Service** | `/api/v1/studios` | `/studios/...` | Bearer JWT |
| **Novel Service (Public & Novel authoring)** | `/api/v1/novels` | `/novels/...` | Public or Bearer JWT |
| **Novel Service (Studio-scoped novel management)** | `/api/v1/novels/studios` | `/studios/...` | Bearer JWT + Studio Permission |
| **Engagement Service** | `/api/v1/engagement` | `/...` | Public or Bearer JWT |
| **Notification Service** | `/api/v1/notifications` | N/A (Internal async) | None for browser (RabbitMQ listener) |
| **AI Service** | N/A | N/A | Scaffolded only |
| **Analytics Service** | N/A | N/A | Scaffolded only |

---

## 2. Authentication & JWT Structure

### JWT Token Format
- **Algorithm:** HMAC-SHA (HS256/384/512)
- **Lifetime:** 10 minutes (`expiration = now + 10m`)
- **Claims:**
  - `sub`: Username string (e.g. `"john_doe"`)
  - `userId`: String representation of user ID (e.g. `"1"`)
  - `roles`: Array of role names (e.g. `["USER"]`, `["ADMIN"]`)
  - `type`: String token type (`"access"`)
  - `authorities`: Array of strings including both `ROLE_<ROLE>` and individual permissions (e.g. `["ROLE_USER", "NOVEL_READ", "CHAPTER_READ", "BECOME_CREATOR"]`)
  - `iat`: Issued at epoch timestamp
  - `exp`: Expiration epoch timestamp

### Refresh Token & Session Management
- **Format:** Signed JWT with `type: "refresh"`, lifetime = 30 days.
- **Storage:** Stored in an HTTP-only cookie named `refreshToken`, `path=/`, `sameSite=Lax` (or `None` with `secure=true` in production).
- **Silent Refresh Endpoint:** `POST /api/v1/identity/auth/refresh` with credentials (`withCredentials: true`). Returns a new `LoginResponseDto` containing the refreshed `accessToken`.
- **Logout Endpoint:** `POST /api/v1/identity/auth/logout`. Clears the `refreshToken` cookie (`maxAge=0`).

---

## 3. Access Control: Roles, Permissions & Lifecycle

NovelForge operates a two-tier permission system:
1. **Global Platform Roles & Permissions** (Identity Service)
2. **Studio Roles & Permissions** (Studio Service & Novel Service)

### 3.1 Global Platform Roles (`RoleType`)
```
USER, MODERATOR, ADMIN
```

### 3.2 Global Platform Permissions (`PermissionType`)
- `NOVEL_READ`: Browse and read published novels and chapters
- `NOVEL_UPDATE`: Edit novels (moderation / admin override)
- `NOVEL_DELETE`: Delete novels (moderation / admin override)
- `CHAPTER_READ`: Read chapters
- `CHAPTER_UPDATE`: Edit chapters (moderation / admin override)
- `CHAPTER_DELETE`: Delete chapters (moderation / admin override)
- `BECOME_CREATOR`: Activate creator status to create and own studios
- `USER_READ`: Inspect user accounts and profiles
- `USER_UPDATE`: Modify user accounts / statuses
- `USER_DELETE`: Block or soft-delete user accounts
- `MODERATOR_CREATE`: Appoint moderators
- `MODERATOR_READ`: View moderation queues
- `MODERATOR_UPDATE`: Act on moderation cases
- `MODERATOR_DELETE`: Revoke moderator permissions

#### Global Role Permissions Mapping (`RolePermissions.java`):
- **`USER`:**
  - `NOVEL_READ`
  - `CHAPTER_READ`
  - `BECOME_CREATOR`
- **`MODERATOR`:**
  - `NOVEL_READ`, `NOVEL_UPDATE`, `NOVEL_DELETE`
  - `CHAPTER_READ`, `CHAPTER_UPDATE`, `CHAPTER_DELETE`
  - `USER_READ`
- **`ADMIN`:**
  - All 13 permissions (`EnumSet.allOf(PermissionType.class)`)

### 3.3 Creator Status Lifecycle (`CreatorStatus`)
- `NONE`: Regular reader, not yet a creator
- `ACTIVE`: Creator status enabled, can create and manage studios
- `SUSPENDED`: Creator privileges suspended by moderation
- `DEACTIVATED`: Creator deactivated by user

### 3.4 Studio Roles & Permissions (`StudioRoleType` & `StudioPermission`)

#### Studio Roles:
`OWNER`, `EDITOR`, `WRITER`, `ILLUSTRATOR`, `TRANSLATOR`

#### Studio Permissions:
- `STUDIO_POST_CREATE`
- `NOVEL_READ`
- `NOVEL_LIST`
- `NOVEL_CREATE`
- `NOVEL_EDIT`
- `NOVEL_DELETE`
- `NOVEL_DELETE_CANCEL`
- `NOVEL_PUBLISH`
- `CHAPTER_READ`
- `CHAPTER_CREATE`
- `CHAPTER_METADATA_EDIT`
- `CHAPTER_EDIT_PUBLISHED`
- `CHAPTER_TEXT_EDIT`
- `CHAPTER_ILLUSTRATION_EDIT`
- `CHAPTER_DELETE`
- `CHAPTER_PUBLISH`
- `CHAPTER_SCHEDULE`
- `CHAPTER_SCHEDULE_CANCEL`

#### Studio Role Permissions Matrix (`StudioServiceImpl.java`):
- **`OWNER`**: All Studio Permissions
- **`EDITOR`**: `STUDIO_POST_CREATE`, `NOVEL_READ`, `NOVEL_LIST`, `NOVEL_CREATE`, `NOVEL_EDIT`, `NOVEL_PUBLISH`, `CHAPTER_READ`, `CHAPTER_CREATE`, `CHAPTER_METADATA_EDIT`, `CHAPTER_EDIT_PUBLISHED`, `CHAPTER_TEXT_EDIT`, `CHAPTER_ILLUSTRATION_EDIT`, `CHAPTER_DELETE`, `CHAPTER_PUBLISH`, `CHAPTER_SCHEDULE`, `CHAPTER_SCHEDULE_CANCEL`
- **`WRITER`**: `NOVEL_READ`, `NOVEL_LIST`, `CHAPTER_READ`, `CHAPTER_CREATE`, `CHAPTER_METADATA_EDIT`, `CHAPTER_TEXT_EDIT`, `CHAPTER_DELETE`
- **`ILLUSTRATOR`**: `NOVEL_READ`, `NOVEL_LIST`, `CHAPTER_READ`, `CHAPTER_ILLUSTRATION_EDIT`
- **`TRANSLATOR`**: `NOVEL_READ`, `NOVEL_LIST`, `CHAPTER_READ`

---

## 4. Response Envelope, Pagination & Error Handling

### Standard Response Envelope
Successful queries return the DTO or Spring Data `Page<T>` directly without redundant wrapper metadata:
```json
{
  "content": [ ... ],
  "pageable": { ... },
  "totalPages": 3,
  "totalElements": 52,
  "last": false,
  "number": 0,
  "size": 20,
  "first": true,
  "empty": false
}
```

### Cursor Pagination (Engagement Feed)
```json
{
  "posts": [ ... ],
  "nextCursor": "1730000000000"
}
```

### Error Envelopes
1. **Identity & Common Errors (`ErrorDetails`):**
```json
{
  "timestamp": "2026-10-26T08:21:47",
  "message": "Invalid email/username or password",
  "details": "uri=/api/v1/identity/auth/login"
}
```
2. **Novel Service Errors (`NovelExceptionHandler`):**
```json
{
  "error": "Bad Request",
  "message": "title: must not be blank"
}
```
3. **HTTP 401 / 403 Standard Status:**
Returned on unauthorized or missing permission.

---

## 5. Exhaustive Endpoint Catalog

### 5.1 Identity Service (`/api/v1/identity`)

| Method | Path | Auth | Roles/Perms | Request Body | Response Body |
|---|---|---|---|---|---|
| `POST` | `/register/send-otp` | Public (Rate-limited) | None | `{ email: string }` | Text: `"OTP delivery request accepted"` (Sets `otpFlowId` cookie) |
| `POST` | `/register/verify-otp` | Public (Rate-limited) | None | `{ email: string, otp: string }` | Text: `"Email Verified Successfully"` |
| `POST` | `/register` | Public | None | `RegisterRequestDto` (`email`, `username`, `password`, `profileImageName?`, `bannerImageName?`, `profileVisibility?`) | `RegisterResponseDto` (`message`, `userId`, `username`, `accessToken`) + sets `refreshToken` cookie |
| `POST` | `/auth/login` | Public | None | `LoginRequestDto` (`identifier`, `password`) | `LoginResponseDto` (`userId`, `username`, `accessToken`) + sets `refreshToken` cookie |
| `POST` | `/auth/refresh` | Cookie (`refreshToken`) | None | None | `LoginResponseDto` (`userId`, `username`, `accessToken`) |
| `POST` | `/auth/logout` | Bearer Token | Authenticated | None | 204 No Content (Clears `refreshToken` cookie) |
| `GET` | `/auth/me` | Bearer Token | Authenticated | None | `UserMeResponseDto` (`id`, `username`, `email`, `roles: RoleType[]`, `emailVerified: boolean`, `accountStatus: AccountStatus`) |
| `POST` | `/auth/forgot-password` | Public (Rate-limited) | None | `{ email: string }` | 202 Accepted (Sets `resetOtpFlowId` cookie) |
| `POST` | `/auth/forgot-password/verify` | Public (Rate-limited) | None | `{ email: string, otp: string }` | 200 OK |
| `POST` | `/auth/forgot-password/reset` | Public | None | `{ email: string, newPassword: string }` | 200 OK |
| `GET` | `/profile/me` | Bearer Token | Authenticated | None | `UserProfileResponseDto` (`userId`, `username`, `displayName`, `bio`, `profileImageName`, `bannerImageName`, `visibility: ProfileVisibility`, `creatorStatus: CreatorStatus`) |
| `GET` | `/profile/{userId}` | Bearer Token | Authenticated | None | `UserProfileResponseDto` |
| `PATCH` | `/profile/me` | Bearer Token | Authenticated | `UpdateUserProfileRequestDto` (`displayName`, `bio`, `profileImageName`, `bannerImageName`, `visibility`) | `UserProfileResponseDto` |
| `POST` | `/profile/creator` | Bearer Token | `BECOME_CREATOR` | None | `UserProfileResponseDto` (sets `creatorStatus: ACTIVE`) |
| `POST` | `/profile/creator/deactivate` | Bearer Token | Authenticated | None | `UserProfileResponseDto` (sets `creatorStatus: DEACTIVATED`) |
| `DELETE` | `/account` | Bearer Token | Authenticated | None | `{ message: string }` (account status becomes `PENDING_DELETION`) |
| `POST` | `/account/cancel-deletion` | Bearer Token | Authenticated | None | `{ message: string }` (account status restores to `ACTIVE`) |

### 5.2 Studio Service (`/api/v1/studios`)

> **Studio Platform Constraints:**
> 1. **Single Studio Creation Limit:** An individual account (single user/email) can create only **1 Studio** as OWNER (`studioRepository.existsByOwnerUserIdAndDeletedAtIsNull`). Attempting to create a second studio returns HTTP 400 Bad Request (`"An account can only create one Studio."`).
> 2. **Studio Membership Capacity:** A user account can belong to a maximum of **5 Studios** concurrently across all roles (`membershipRepository.countByUserIdAndStatusAndDeletedAtIsNull >= 5`). Attempting to exceed this limit via creation, invitation, or acceptance returns HTTP 400 Bad Request (`"You have reached the maximum limit of 5 joined Studios."`).

| Method | Path | Auth | Roles/Perms | Request Body | Response Body |
|---|---|---|---|---|---|
| `GET` | `/studios/me` | Bearer Token | Authenticated | None | `StudioResponseDto[]` |
| `GET` | `/studios/{studioId}/membership` | Bearer Token | Authenticated | None | `MyStudioMembershipDto` (`studioId`, `userId`, `permissions: string[]`) |
| `POST` | `/studios` | Bearer Token | Creator Active | `CreateStudioRequestDto` (`studioName`, `studioHandle`, `profileImageName?`, `bannerImageName?`, `description?`, `visibilityType?`) | `StudioResponseDto` |
| `GET` | `/studios` | Bearer Token | Authenticated | Query: `query?`, `page`, `size` | `Page<StudioResponseDto>` |
| `GET` | `/studios/{studioId}` | Bearer Token | Authenticated | None | `StudioResponseDto` |
| `PUT` | `/studios/{studioId}` | Bearer Token | Studio Owner | `UpdateStudioRequestDto` (`studioName`, `studioHandle`, `profileImageName?`, `bannerImageName?`, `description?`, `visibilityType`) | `StudioResponseDto` |
| `DELETE` | `/studios/{studioId}` | Bearer Token | Studio Owner | None | `StudioResponseDto` (Status `PENDING_DELETION`) |
| `POST` | `/studios/{studioId}/deletion/cancel` | Bearer Token | Studio Owner | None | `StudioResponseDto` (Restored to `ACTIVE`) |
| `POST` | `/studios/{studioId}/members` | Bearer Token | Studio Owner | `InviteStudioMemberRequestDto` (`inviteeUserId`, `role: StudioRoleType`) | `StudioMembershipResponseDto` |
| `POST` | `/studios/invitations/{membershipId}/accept` | Bearer Token | Invited User | None | `StudioMembershipResponseDto` |
| `PATCH` | `/studios/{studioId}/members/{memberUserId}/role` | Bearer Token | Studio Owner | `UpdateStudioMemberRoleRequestDto` (`role: StudioRoleType`) | `StudioMembershipResponseDto` |
| `DELETE` | `/studios/{studioId}/members/{memberUserId}` | Bearer Token | Studio Owner / Self | None | 204 No Content |
| `GET` | `/studios/{studioId}/members` | Bearer Token | Studio Member | Query: `page`, `size` | `Page<StudioMembershipResponseDto>` |

### 5.3 Novel & Chapter Service (`/api/v1/novels`)

> **Sequential Chapter Block Architecture:**
> Chapters store content in MongoDB as an ordered sequence of typed blocks (`blocks: ChapterBlock[]`).
> - **Block Schema:** `{ id, position, type: ChapterContentType, text?, imageUrl?, caption?, altText? }`
> - **Types Supported:**
>   - `TEXT`: Narrative paragraphs, dialogue, or formatted excerpts (quotes).
>   - `ILLUSTRATION`: Embedded high-resolution artwork or panels with direct file upload preview (`ImageUploader`), custom captions, and accessible alt text.
> - **Sequencing Operations:** Blocks can be appended (`POST /blocks`), dynamically reordered (`PUT /blocks/{blockId}` with position), or pruned (`DELETE /blocks/{blockId}`). Both the Reader and Studio Editor preserve this sequential flow.

| Method | Path | Auth | Roles/Perms | Request Body | Response Body |
|---|---|---|---|---|---|
| `GET` | `/novels/search` | Public | None | Query: `query?`, `category?`, `genre?`, `tag?`, `page`, `size` | `Page<NovelResponseDto>` |
| `GET` | `/novels/{novelId}` | Public | None | None | `NovelResponseDto` |
| `GET` | `/novels/{novelId}/chapters` | Public | None | Query: `page`, `size` | `Page<ChapterResponseDto>` |
| `GET` | `/novels/{novelId}/chapters/{chapterId}` | Public | None | None | `ChapterResponseDto` (includes ordered `blocks: ChapterBlockResponseDto[]`) |
| `POST` | `/novels/studios/{studioId}/novels` | Bearer Token | `NOVEL_CREATE` | `NovelRequestDto` (`title`, `synopsis`, `categoryType: CategoryType`, `genres: Set<string>`, `tags: Set<string>`) | `NovelResponseDto` |
| `GET` | `/novels/studios/{studioId}/novels` | Bearer Token | `NOVEL_LIST` | Query: `page`, `size` | `Page<NovelResponseDto>` |
| `GET` | `/novels/studios/{studioId}/novels/{novelId}` | Bearer Token | `NOVEL_READ` | None | `NovelResponseDto` |
| `PUT` | `/novels/{novelId}` | Bearer Token | `NOVEL_EDIT` | `NovelRequestDto` | `NovelResponseDto` |
| `DELETE` | `/novels/{novelId}` | Bearer Token | `NOVEL_DELETE` | None | 204 No Content |
| `POST` | `/novels/{novelId}/deletion/cancel` | Bearer Token | `NOVEL_DELETE_CANCEL` | None | `NovelResponseDto` |
| `POST` | `/novels/{novelId}/publish` | Bearer Token | `NOVEL_PUBLISH` | None | `NovelResponseDto` |
| `POST` | `/novels/{novelId}/chapters` | Bearer Token | `CHAPTER_CREATE` | `CreateChapterRequestDto` (`chapterNumber: number`, `title: string`) | `ChapterResponseDto` |
| `GET` | `/novels/studios/{studioId}/novels/{novelId}/chapters` | Bearer Token | `CHAPTER_READ` | Query: `page`, `size` | `Page<ChapterResponseDto>` |
| `GET` | `/novels/studios/{studioId}/novels/{novelId}/chapters/{chapterId}` | Bearer Token | `CHAPTER_READ` | None | `ChapterResponseDto` |
| `PATCH` | `/novels/{novelId}/chapters/{chapterId}` | Bearer Token | `CHAPTER_METADATA_EDIT` | `UpdateChapterRequestDto` (`chapterNumber?`, `title?`) | `ChapterResponseDto` |
| `DELETE` | `/novels/{novelId}/chapters/{chapterId}` | Bearer Token | `CHAPTER_DELETE` | None | 204 No Content |
| `POST` | `/novels/{novelId}/chapters/{chapterId}/blocks` | Bearer Token | `CHAPTER_TEXT_EDIT` / `CHAPTER_ILLUSTRATION_EDIT` | `ChapterBlockRequestDto` (`position`, `type: ChapterContentType`, `text?`, `imageUrl?`, `caption?`, `altText?`) | `ChapterResponseDto` |
| `PUT` | `/novels/{novelId}/chapters/{chapterId}/blocks/{blockId}` | Bearer Token | `CHAPTER_TEXT_EDIT` / `CHAPTER_ILLUSTRATION_EDIT` | `ChapterBlockRequestDto` | `ChapterResponseDto` |
| `DELETE` | `/novels/{novelId}/chapters/{chapterId}/blocks/{blockId}` | Bearer Token | `CHAPTER_TEXT_EDIT` / `CHAPTER_ILLUSTRATION_EDIT` | None | 204 No Content |
| `POST` | `/novels/{novelId}/chapters/{chapterId}/publish` | Bearer Token | `CHAPTER_PUBLISH` | None | `ChapterResponseDto` |
| `POST` | `/novels/{novelId}/chapters/{chapterId}/schedule` | Bearer Token | `CHAPTER_SCHEDULE` | `ScheduleChapterRequestDto` (`publishAt: string ISO`) | `ChapterResponseDto` |
| `DELETE` | `/novels/{novelId}/chapters/{chapterId}/schedule` | Bearer Token | `CHAPTER_SCHEDULE_CANCEL` | None | `ChapterResponseDto` |

### 5.4 Engagement & Social Service (`/api/v1/engagement`)

| Method | Path | Auth | Roles/Perms | Request Body | Response Body |
|---|---|---|---|---|---|
| `PUT` | `/follows/{type}/{targetId}` | Bearer Token | Authenticated | None (`type`: `CREATOR` \| `STUDIO`) | `EngagementCountResponse` (`count: number`, `active: boolean`) |
| `DELETE` | `/follows/{type}/{targetId}` | Bearer Token | Authenticated | None | `EngagementCountResponse` |
| `GET` | `/follows/me` | Bearer Token | Authenticated | None | `FollowSummary[]` (`targetType`, `targetId`, `followedAt`) |
| `GET` | `/follows/{type}/{targetId}/count` | Public | None | None | `EngagementCountResponse` |
| `POST` | `/targets/{type}/{targetId}/likes` | Bearer Token | Authenticated | None (`type`: `NOVEL` \| `CHAPTER` \| `POST`) | `EngagementCountResponse` |
| `DELETE` | `/targets/{type}/{targetId}/likes` | Bearer Token | Authenticated | None | `EngagementCountResponse` |
| `GET` | `/targets/{type}/{targetId}/likes/count` | Public | None | None | `EngagementCountResponse` |
| `POST` | `/targets/{type}/{targetId}/comments` | Bearer Token | Authenticated | `CommentRequest` (`content: string`) | `CommentResponse` |
| `GET` | `/targets/{type}/{targetId}/comments` | Public | None | Query: `page`, `size` | `Page<CommentResponse>` |
| `PUT` | `/comments/{commentId}` | Bearer Token | Comment Author | `CommentRequest` | `CommentResponse` |
| `DELETE` | `/comments/{commentId}` | Bearer Token | Comment Author | None | 204 No Content |
| `POST` | `/posts` | Bearer Token | Creator or Studio Perm | `CreatePostRequest` (`authorType: PostAuthorType`, `authorId: string`, `content: string`, `imageUrl?: string`, `tags?: Set<string>`) | `PostResponse` |
| `GET` | `/public/posts` | Public | None | Query: `page`, `size` | `Page<PostResponse>` |
| `GET` | `/public/posts/{postId}` | Public | None | None | `PostResponse` |
| `PUT` | `/posts/{postId}` | Bearer Token | Post Author | `CreatePostRequest` | `PostResponse` |
| `DELETE` | `/posts/{postId}` | Bearer Token | Post Author | None | 204 No Content |
| `POST` | `/posts/{postId}/shares` | Bearer Token | Authenticated | None | `EngagementCountResponse` |
| `DELETE` | `/posts/{postId}/shares` | Bearer Token | Authenticated | None | `EngagementCountResponse` |
| `GET` | `/posts/{postId}/shares/count` | Public | None | None | `EngagementCountResponse` |
| `GET` | `/feed` | Bearer Token | Authenticated | Query: `cursor?`, `size?` | `FeedResponse` (`posts: PostResponse[]`, `nextCursor: string`) |
| `GET` | `/collections` | Bearer Token | Authenticated | None | `CollectionSummary[]` |
| `POST` | `/collections` | Bearer Token | Authenticated | `CreateCollectionRequest` (`name: string`, `description?: string`) | `CollectionSummary` |
| `PUT` | `/collections/{collectionId}` | Bearer Token | Collection Owner | `CreateCollectionRequest` | `CollectionSummary` |
| `DELETE` | `/collections/{collectionId}` | Bearer Token | Collection Owner | None | 204 No Content |
| `GET` | `/collections/{collectionId}/items` | Bearer Token | Collection Owner | Query: `page`, `size` | `Page<CollectionItemResponse>` |
| `PUT` | `/collections/{collectionId}/items` | Bearer Token | Collection Owner | `SaveCollectionItemRequest` (`targetType: EngagementTargetType`, `targetId: string`) | `CollectionItemResponse` |
| `DELETE` | `/collections/{collectionId}/items/{itemId}` | Bearer Token | Collection Owner | None | 204 No Content |
| `GET` | `/collections/watch-later` | Bearer Token | Authenticated | None | `CollectionSummary` |
| `GET` | `/collections/watch-later/contains` | Bearer Token | Authenticated | Query: `targetType`, `targetId` | `boolean` (`true` \| `false`) |
| `PUT` | `/collections/watch-later/items` | Bearer Token | Authenticated | `SaveCollectionItemRequest` | `CollectionItemResponse` |
| `DELETE` | `/collections/watch-later/items` | Bearer Token | Authenticated | Query: `targetType`, `targetId` | 204 No Content |

### 5.5 Platform Administration (`/api/v1/admin`)

| Method | Path | Auth | Roles/Perms | Request Body | Response Body |
|---|---|---|---|---|---|
| `GET` | `/admin/users` | Bearer Token | `USER_READ` / `ADMIN` | Query: `query?`, `role?`, `accountStatus?`, `creatorStatus?`, `page`, `size` | `Page<AdminUserResponseDto>` |
| `GET` | `/admin/users/{userId}` | Bearer Token | `USER_READ` / `ADMIN` | None | `AdminUserResponseDto` |
| `PUT` | `/admin/users/{userId}/roles` | Bearer Token | `MODERATOR_UPDATE` / `USER_UPDATE` / `ADMIN` | `AdminUpdateRolesRequestDto` (`roles: RoleType[]`) | `AdminUserResponseDto` |
| `PATCH` | `/admin/users/{userId}/status` | Bearer Token | `USER_UPDATE` / `ADMIN` | `AdminUpdateStatusRequestDto` (`accountStatus?`, `creatorStatus?`) | `AdminUserResponseDto` |
| `GET` | `/admin/stats` | Bearer Token | `USER_READ` / `ADMIN` | None | `AdminPlatformStatsDto` |

### 5.6 Content Moderation Center (`/api/v1/moderation`)

| Method | Path | Auth | Roles/Perms | Request Body | Response Body |
|---|---|---|---|---|---|
| `POST` | `/moderation/reports` | Bearer Token | Authenticated | `CreateReportRequestDto` (`targetType`, `targetId`, `targetTitle?`, `reason`, `details?`) | `ModerationReportResponseDto` |
| `GET` | `/moderation/reports` | Bearer Token | `MODERATOR_READ` / `ADMIN` / `MODERATOR` | Query: `status?`, `targetType?`, `page`, `size` | `Page<ModerationReportResponseDto>` |
| `GET` | `/moderation/reports/{reportId}` | Bearer Token | `MODERATOR_READ` / `ADMIN` / `MODERATOR` | None | `ModerationReportResponseDto` |
| `POST` | `/moderation/reports/{reportId}/resolve` | Bearer Token | `MODERATOR_UPDATE` / `ADMIN` / `MODERATOR` | `ResolveReportRequestDto` (`action`, `resolutionNote?`) | `ModerationReportResponseDto` |
| `GET` | `/moderation/stats` | Bearer Token | `MODERATOR_READ` / `ADMIN` / `MODERATOR` | None | `ModerationStatsDto` |

---

## 6. Discrepancies: `API.md` vs. Actual Backend Code

1. **Studios list for current user:**
   - `API.md` lists `GET /studios?page=0&size=20`.
   - **Backend Code:** `StudioController.java` has `@GetMapping("/me")` which returns `List<StudioResponseDto>`. `GET /studios` is a public search endpoint taking `@RequestParam String query` and returning a `Page<StudioResponseDto>`.
2. **Studio-scoped Novel Routes:**
   - In `API.md`, routes are written as `POST /studios/{studioId}/novels`.
   - In API Gateway configuration (`application.yml`), the predicate is `Path=/api/v1/novels/studios/**` rewritten to `/studios/...` for `novel-service`. Calling `/api/v1/novels/studios/{studioId}/novels` correctly hits `NovelController`.
3. **Current User Studio Permissions:**
   - `StudioController.java` provides `GET /studios/{studioId}/membership` returning `MyStudioMembershipDto` (`studioId`, `userId`, `permissions`), which allows the client to immediately know the acting member's exact studio permissions without making internal service-to-service calls.
4. **Registration OTP Flow:**
   - `RegistrationController.java` generates and expects an `otpFlowId` cookie during `send-otp`, `verify-otp`, and `register`.

---

## 7. Service and Contract Status

The following modules remain scaffolded or mocked:

1. **ImageKit Upload Authentication:**
   - `GET /api/v1/identity/profile/imagekit-auth` returns one-time `token`, `expire`, and `signature` values.
   - The identity service signs with server-only `IMAGEKIT_PRIVATE_KEY`; the browser uploads directly to ImageKit and sends only the resulting URL to NovelForge APIs.
2. **Moderation Queue & Actions (`MODERATOR` area):**
   - Report create/list/resolve/stats endpoints are implemented on `identity-service` (`/api/v1/identity/moderation/**`). Resolution currently records `RESOLVE` or `DISMISS` plus a note. Content takedown, creator warning, and account suspension are not performed by report resolution.
3. **Admin User Management & Platform Analytics (`ADMIN` area):**
   - Implemented on `identity-service` (`/api/v1/identity/admin/**`) with automated system bootstrap runner.
4. **Studio Analytics (`/analytics`):**
   - `analytics-service` is an empty Spring Boot scaffold with 0 endpoints.
   - Handled in `src/features/studio/StudioDashboard.tsx` with fallback overview metrics.
5. **AI Service (`/ai`):**
   - `ai-service` is an empty Spring Boot scaffold with 0 endpoints.
