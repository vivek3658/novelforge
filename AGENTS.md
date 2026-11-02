# AGENTS.md — novelforge-client

Instructions for any AI coding agent (Antigravity/agy, Claude Code, Cursor, etc.) working on the React client of NovelForge. Read this fully before changing anything.

## 0. Ground rules

1. **Never guess endpoints, request bodies or response shapes.** Read `api.md` and the backend controllers/DTOs (`identity-service`, `novel-service`, `studio-service`, `novelforge-common`) first. If the frontend needs an endpoint that does not exist, do NOT invent one. Write it down in `docs/BACKEND_GAPS.md` (method, path, request, response, why) and continue with the rest.
2. **Inspect before editing.** Open `package.json`, the router, and the existing components. Use the libraries already installed. Do not add a new UI library, state library or CSS system without asking.
3. **Small, reviewable changes.** One concern per commit/PR. Do not rewrite the whole app in one go.
4. **Do not break working flows** (login, register + OTP, refresh token, logout). Run the build and lint after every task.

## 1. First task: audit (do this before fixing anything)

Create `docs/UI_AUDIT.md` listing:
- Every page/route and what it does
- Duplicate or near-duplicate components (several button / input / card / modal styles)
- Hardcoded colors, spacing, font sizes, and URLs
- Places where a raw ID, UUID or internal value is shown to or typed by the user
- Places with missing loading, error or empty states
- Places calling the API directly instead of through the API layer
- Frontend calls that do not match `api.md`

Then propose a fix order. Wait for approval if the plan touches more than ~10 files.

## 2. Known problems to fix (priority order)

### P0 — Studio invite must not need a user ID
- Users must never type or see a user ID. Replace it with **search by username or email** with a debounced autocomplete dropdown (avatar, display name, @username).
- Show the selected person as a chip, let the user pick a **role/permission** for the invite, then a clear "Send invite" button.
- States: searching, no results, already a member, already invited, invite sent, error.
- The backend probably needs a user-search endpoint (e.g. `GET /api/v1/identity/users/search?q=`) that returns only safe public fields (id, username, displayName, avatarUrl). If missing, log it in `docs/BACKEND_GAPS.md`. The ID is used internally only, never shown.

### P1 — Consistent UI
- Build ONE small design system in `src/components/ui/`: Button, IconButton, Input, Textarea, Select, Checkbox/Switch, Modal, Drawer, Tabs, Card, Badge, Avatar, Tooltip, Toast, Skeleton, EmptyState, ConfirmDialog, Pagination.
- Replace ad-hoc markup with these. No page should style its own buttons or inputs.
- Design tokens (single source: CSS variables or the Tailwind theme, whichever the project already uses): white + green palette, full **dark mode**, one spacing scale, one radius scale, one type scale. No hex colors inside components.
- Reading pages feel like a novel app (calm, readable, generous whitespace). Studio/dashboard feels like a YouTube-channel studio (sidebar, tables, stats cards).

### P2 — User-friendly behavior
- Every async screen has loading (skeleton), error (message + retry) and empty (explanation + next action) states.
- Forms: inline validation, disabled-while-submitting, clear error messages from the backend envelope (never show raw stack traces or "Request failed with status code 400").
- Destructive actions (delete novel, remove member, delete chapter) use `ConfirmDialog`. Soft-deleted items show "restore" where the backend supports it (30-day window).
- Success and failure feedback via toasts.
- Responsive down to mobile. Keyboard accessible: visible focus, labels on inputs, `aria-*` on modals and menus, alt text on images.

### P3 — Developer friendly
- Feature-based structure:
  ```
  src/
    app/            router, providers, layout shells
    features/       auth/ novels/ reader/ studio/ profile/ admin/ moderation/
      <feature>/    api/ hooks/ components/ pages/ types/
    components/ui/  shared design-system components
    lib/            apiClient, queryClient, env, utils
    styles/         tokens, globals
  ```
- **One API client** (`lib/apiClient`): base URL from env (`VITE_*`/equivalent, never hardcoded), attaches the access token, handles refresh on 401 once, unwraps the shared response envelope from `novelforge-common`, and throws a typed `ApiError`. All requests go through the gateway (`:8080`).
- Server data via the data-fetching library already in the project (e.g. TanStack Query if present). No fetching inside random components.
- Types for every request/response, matching backend DTOs. No `any`.
- `.env.example` with every variable. `README` section "Run the client locally".
- ESLint + Prettier configured; `npm run lint` and `npm run build` must pass with zero errors.

## 3. Product rules the UI must respect

- Roles: `USER`, `WRITER/AUTHOR`, `MODERATOR`, `ADMIN`. Access is **permission based**, not only role based. Use a `usePermission()` hook and a `<RequirePermission>` guard. Hide or disable what the user cannot do, and always rely on the backend for real enforcement.
- Readers get a **first-5-pages preview** on novels they have not unlocked; show a clear prompt for the rest.
- Chapter editor is a **list of blocks** (text or illustration). The user can add several in a row, reorder, and delete them.
- Images (illustrations, profile pictures) are uploaded **from the client to ImageKit**. Only the returned URL is sent to our backend. Show upload progress and errors.
- Admin and moderation screens are not built yet. Do not fake data for them; leave a clearly marked placeholder route.
- Never show internal IDs, tokens, or raw JSON to users.

## 4. Definition of done (for every task)

- [ ] Matches `api.md` / backend code (no guessed endpoints)
- [ ] Uses shared `ui/` components and design tokens only
- [ ] Works in light and dark mode and on mobile width
- [ ] Loading, error and empty states handled
- [ ] No raw IDs shown or typed by users
- [ ] No `any`, no hardcoded URLs or colors, no unused code
- [ ] `npm run lint` and `npm run build` pass
- [ ] Short summary of what changed and what is still open (also update `docs/BACKEND_GAPS.md` if needed)

## 5. When unsure

Ask a short question instead of guessing. Prefer the simplest solution that is consistent with the rest of the codebase.