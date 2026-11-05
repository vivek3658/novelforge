# NovelForge Client UI & API Audit

Audit Date: 2026-11-03 (follow-up to initial audit)
Target: `novelforge-client` React application  
Reference: `AGENTS.md`, `API.md`, `BACKEND_GAPS.md`, and microservice controllers (`identity-service`, `novel-service`, `studio-service`, `engagement-service`).

Follow-up verification:
- Profile/creator/account/moderation account lookup now resolves the JWT `AuthenticatedUser` principal's username explicitly.
- Admin role/status values and moderation counters now match backend enums and DTO fields; moderator controls expose report triage only.
- Image uploads now use authenticated server signatures and upload directly to ImageKit; NovelForge receives only the hosted URL.
- Chapter comments/likes use `novelId:chapterId`, Reader pagination respects the 100-item limit, and authoring supports automatic chapter numbering and inline text-block edits.
- The shared client API layer uses a 60-second default timeout and retries safe GETs at most twice for transient network or 502/503/504 responses.
- Live deployment calls were not exercised in this workspace; `IMAGEKIT_PRIVATE_KEY` must be configured in identity-service before uploads can succeed.

---

## 1. Route Inventory & Purpose

| Route | Component | Purpose | Current Status & Issues |
|---|---|---|---|
| `/` | `Home.jsx` | Landing page, hero spotlight, genre shelving, community updates strip | Cleanly written, but uses hardcoded hex colors and ad-hoc buttons (`cr-btn-primary`, `cr-btn-secondary`). |
| `/trending` | `Trending.jsx` | Recent published novels | **Minified/obfuscated code** with single-letter variables (`u, r, d, o, f, p, v`), missing React `key` props on cards. |
| `/novels` | `Novels.jsx` | Catalog search & filters (category, genre, tag, pagination) | **Minified/obfuscated code** (`u, r, d, o, f, p, v, N, x, g, C, y, M, Q, V, D, U, K, B, A, k, ee, te`), missing keys on mapped results. |
| `/categories` | `Categories.jsx` | Genre & shelf discovery | **Minified/obfuscated code**, single-line JSX, missing React keys on mapped links, swallows API errors with empty `catch(() => {})`. |
| `/community` | `Community.jsx` | Creator & studio updates feed, post composer | Allows non-creators to compose posts and fails on submit (403 Forbidden) instead of guiding them to become a creator. |
| `/novels/:novelId` | `NovelDetail.jsx` | Novel synopsis, chapter list, comments & likes | **Minified/obfuscated code**, missing React keys, ignores `novel.coverImageUrl` in favor of static CSS gradients, lacks proper retry on comment failure. |
| `/novels/:novelId/read/:chapterId` | `Reader.jsx` | Reader view for chapter blocks, sepia/dark/light themes | Clean structure; needs unified design system tokens for reader toolbar and comment section. |
| `/login` | `Login.jsx` | User authentication | **Minified/obfuscated code** (`u, r, d, o, f, p, v, N, x, g, C, y, M, Q, D, U, K, B, A, k`), dense single-line JSX. |
| `/register` | `Register.jsx` | 3-step OTP registration flow | **Minified/obfuscated code**, dense single-line JSX, hardcoded styles. |
| `/forgot-password` | `ForgotPassword.jsx` | 3-step OTP password reset | **Minified/obfuscated code**, dense single-line JSX, hardcoded styles. |
| `/profile`, `/me` | `Profile.jsx` | User profile, reading queue, authored novels, settings | **Minified/obfuscated code**, **displays raw IDs** (`Novel #{$.targetId || $.id}`) for saved items, dead unused `Nr` component at bottom, silent error swallowing. |
| `/library` | `Library.jsx` | User collections & Watch Later shelf | **Minified/obfuscated code**, ESLint warning (`useEffect` missing dependency `'$'`), dead leftover studio forms at file bottom. |
| `/studio` | `StudioEditor.jsx` | Creator studio dashboard, novels, chapters, team | Complex monolithic component (~1700 lines), duplicate novel creation forms (inline + modal), team invitations blocked due to backend search gap. |
| `/admin`, `/moderation` | `AdminConsole.jsx` | Administration & content moderation queue | Functional for staff, but uses raw table markup and ad-hoc tab buttons instead of shared UI components. |
| `*` | `NotFound.jsx` | 404 page | Hardcoded inline styles. |

---

## 2. Developer-Friendliness & Code Quality Findings

1. **Obfuscated / Minified Source Files**:
   - 9 major pages (`Categories.jsx`, `Trending.jsx`, `Novels.jsx`, `NovelDetail.jsx`, `Library.jsx`, `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `Profile.jsx`) were replaced or created from minified bundles.
   - They contain single-letter variables (`u, r, d, o, f, p, v, N, x, g, C, y, M, Q, V, D, U, K, B, A, k, ee, te, W, I, J, q, le`), comma expressions (`return B(!0), Promise.all(...)`), and lack developer readability.
   - This directly breaks `AGENTS.md` section P3 ("Developer friendly").
2. **ESLint & Hook Warnings**:
   - `src/pages/Library.jsx: React Hook useEffect has a missing dependency: '$'`.
   - React Fast Refresh warnings in `AuthContext.jsx`, `ThemeContext.jsx`, and `ToastContext.jsx` (exporting both components and custom hooks from context files).
3. **Dead / Leftover Code**:
   - `src/pages/Library.jsx` (lines 134-146): declares `INITIAL_STUDIO_FORM` and `INITIAL_NOVEL_FORM` at the bottom of the file which are never used.
   - `src/pages/Profile.jsx` (lines 215-223): contains an unused duplicate novel card function `Nr`.
   - `src/pages/StudioEditor.jsx`: contains two separate novel creation forms (inline on lines 829-836 and in a modal on lines 1523-1540).

---

## 3. UI Inconsistencies & Duplicate Components

1. **Button Inconsistency**:
   - Multiple conflicting classes: `.cr-btn-primary`, `.cr-btn-secondary`, `.product-button`, `.quiet-button`, `.auth-btn-primary`, `.auth-btn-secondary`, `.ig-btn-edit`, `.yt-create-btn`, and inline style overrides (`style={{ padding: '0.7rem 1.6rem' }}`).
2. **Input & Form Inconsistency**:
   - Form inputs vary widely: `.form-input`, `.catalog-search input`, `.ig-comment-input`, `.ig-composer-textarea`, `.chapter-manuscript`, `.field input`.
   - No standardized `<Input />`, `<Textarea />`, `<Select />`, or `<Button />` in `src/components/ui/`.
3. **Card Styles**:
   - Book covers rendered via `.book-card` / `.book-cover` in `NovelCard.jsx`.
   - Distinct poster cards in `Profile.jsx` (`.cr-card-poster`).
   - Spotlight card in `Home.jsx`.
4. **Hardcoded Colors**:
   - Hex colors such as `#f47521`, `#10b981`, `#ef4444`, `#94a3b8`, `#1e293b`, `#2563eb` are directly used in inline styles instead of referencing CSS variables (`var(--primary)`, `var(--text-muted)`, `var(--danger)`, etc.).

---

## 4. Raw IDs and Internal Values Exposed to Users

1. **`Profile.jsx` (Saved tab)**:
   - Displays `<div className="cr-card-title-art">Novel #{$.targetId || $.id}</div>` with subtitle "Saved Reading Item" because it only reads collection item IDs without fetching the actual novel details.
2. **`Community.jsx` & `PostCard.jsx`**:
   - Post authors fall back to displaying `authorId` or raw IDs when display names are not resolved.
   - Comments only return `userId` from backend, leading to "Reader" placeholder or ID display.

---

## 5. Loading, Error, and Empty States

1. **Missing / Silent Errors**:
   - `Categories.jsx`: Silently catches error in `searchNovels`, leaving a blank page below the header if the backend is down.
   - `Profile.jsx`: Silently catches failures when fetching user's authored novels or saved collections, leaving tabs looking empty without explanation or retry buttons.
2. **Misleading Empty States**:
   - `Community.jsx`: Non-creator users are presented with an active post composer; upon clicking submit, they get a 403 error ("A creator can only publish as themselves" / "Only creators or studios can post"). The UI should explain creator status requirements and provide a direct "Become a Creator" action.
3. **Empty States Lacking Actions**:
   - Several empty states in `Trending.jsx` and `Profile.jsx` lack clear next-action buttons.

---

## 6. API Layer & Contract Compliance

1. **API Client Centralization**:
   - All network calls flow through `src/services/api.js` (aliased by `src/api.js`). No direct `fetch` calls exist in page components.
2. **Gateway Configuration Discrepancy**:
   - `api-gateway/src/main/resources/application.yml` had `STUDIO-SERVICE-ROOT` default set to `https://novelforge-studio-service.onrender.com` while `STUDIO-SERVICE` was `http://localhost:8087`. Local requests to `/api/v1/studios` without environment overrides could be misrouted.
3. **Backend Gap: Studio Collaborator Search**:
   - As documented in `BACKEND_GAPS.md`, there is no authenticated public directory search endpoint (`GET /api/v1/identity/users/search?q=`).
   - The Studio Team tab must display an accessible, user-friendly state explaining this requirement without exposing raw user IDs.
4. **Backend Gap: Comment User Profiles**:
   - `CommentResponse` returns `userId` but no username or avatar. A public profile lookup or embedded creator summary is needed to avoid displaying anonymous placeholders.

---

## 7. Proposed Fix Plan (Priority Order)

### Phase 1: Shared UI Design System (`src/components/ui/`)
Create the core design-system components following AGENTS.md P1:
- `Button` (primary, secondary, danger, ghost, quiet)
- `IconButton`
- `Input` & `Textarea`
- `Select`
- `Card`
- `Badge`
- `Avatar`
- `Skeleton`
- `EmptyState`
- `ConfirmDialog`
- `Modal`
All powered by the existing CSS variables in `index.css` (white + green palette, dark mode, responsive).

### Phase 2: Restore Developer-Friendly Pages
De-minify and clean up all 9 obfuscated files into idiomatic, semantic React components:
- `Categories.jsx` (add error banner, retry button, proper keys)
- `Trending.jsx` (proper state management, loading skeletons, error retry)
- `Novels.jsx` (clean search, filter panel, pagination, debounced query)
- `NovelDetail.jsx` (use `coverImageUrl` if available, clean chapter listing, comments)
- `Library.jsx` (fix `useEffect` dependency warning, remove dead studio form code, clean collection handling)
- `Login.jsx` (clear error handling, accessible form controls, clean layout)
- `Register.jsx` (3-step OTP flow, timer, accessible inputs)
- `ForgotPassword.jsx` (3-step reset flow, clean validation)
- `Profile.jsx` (resolve novel metadata for saved items so raw IDs are NEVER shown, remove dead `Nr` component, handle loading/error states)

### Phase 3: User-Friendly Behavior & Flow Polishing
- **Community**: Check `isCreator` and user studios; if not eligible, show an informative card with a 1-click button to "Become a Creator" or create a studio instead of failing after typing.
- **Studio Team**: User-friendly collaborator invitation panel respecting `BACKEND_GAPS.md`.
- **Destructive Actions**: Use `ConfirmDialog` for deleting novels, chapters, or collections.
- **Fast Refresh Cleanups**: Move exported hooks or separate contexts so `eslint .` produces 0 errors and 0 warnings.

## 8. Follow-up Audit (2026-11-05)

The current `StudioEditor.jsx` contains both the novel metadata update form and chapter create/select controls. The novel update uses `PUT /api/v1/novels/novels/{novelId}` through the gateway's `/api/v1/novels/**` rewrite; the backend accepts the submitted title, synopsis, cover URL, category, genres, and tags. The route and payload shape match the controller and DTO, so a runtime update failure is not established by static inspection alone. The client build and lint pass; a browser Network response is needed to diagnose any remaining update error.

The chapter picker and “New Chapter” control were hidden on entry because chapter focus mode defaulted to enabled. This made the existing selection and creation flows appear unavailable. The default has been changed so the chapter list is visible when opening the chapter workspace.

Studio invitations are persisted as `INVITED` studio memberships and can already be accepted by membership ID, but the service had no authenticated endpoint to list invitations for the signed-in recipient and the client had no Inbox route. The separate notification service currently handles OTP email only; it has no user inbox API, and the gateway has no notification route.

### Follow-up Fix Order
1. Keep the chapter list and new-chapter action visible on entry to the writer workspace.
2. Add a recipient-scoped studio-invitation inbox endpoint and a protected client Inbox with loading, error, empty, and accept states.
3. Correct API, architecture, Docker/setup, and project-status documents to match the currently implemented services; remove references to dropped moderation/admin services and other abandoned plans.
4. Describe scalability only with the checked-in 1–3 instance benchmark evidence and state its local resource limits and bottlenecks; do not imply unmeasured production capacity.
