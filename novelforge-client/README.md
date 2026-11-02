# NovelForge — Client Application

> Modern serial fiction reading & creator publishing platform ("YouTube + Instagram for serialized novels").

Built with **React 19**, **TypeScript** (strict mode), **Vite**, **Tailwind CSS**, **TanStack Query**, **Zustand**, **Axios**, and **@dnd-kit**.

---

## 🎨 Design System & Visual Palette

NovelForge features a custom **white + green** design language with fully persistent dark mode support:

- **Light Mode Palette:**
  - Background: `#FFFFFF` (`--color-bg`)
  - Surface: `#F4F8F5` (`--color-surface`)
  - Surface Hover: `#E9F1EC` (`--color-surface-hover`)
  - Primary: `#16A34A` (`--color-primary`)
  - Primary Hover: `#15803D` (`--color-primary-hover`)
  - Text: `#0F1A14` (`--color-text`)
  - Muted: `#5B6B62` (`--color-muted`)
  - Border: `#E2EAE4` (`--color-border`)

- **Dark Mode Palette:**
  - Background: `#0B120E`
  - Surface: `#121C16`
  - Surface Hover: `#19271F`
  - Primary: `#22C55E`
  - Primary Hover: `#16A34A`
  - Text: `#E8F0EA`
  - Muted: `#8FA396`
  - Border: `#22302A`

- **Typography:**
  - UI: `Inter`, system-ui
  - Reader & Prose: `Lora`, `Merriweather`, Georgia, serif
- **Theme Persistence:** Defaults to user's OS preference (`prefers-color-scheme`), persisted to `localStorage`, with an inline head script to guarantee **zero flash of unstyled content (FOUC)** on page load.

---

## 🛡️ Access Control & RBAC Architecture

NovelForge permissions decide UI capabilities dynamically, rather than hardcoded role names:

### 1. Global Platform Roles & Permissions (`identity-service`)
- **Roles:** `USER`, `MODERATOR`, `ADMIN`
- **Permissions:**
  - Novel access: `NOVEL_READ`, `NOVEL_UPDATE`, `NOVEL_DELETE`
  - Chapter access: `CHAPTER_READ`, `CHAPTER_UPDATE`, `CHAPTER_DELETE`
  - Creator status: `BECOME_CREATOR`
  - User admin: `USER_READ`, `USER_UPDATE`, `USER_DELETE`
  - Moderation: `MODERATOR_CREATE`, `MODERATOR_READ`, `MODERATOR_UPDATE`, `MODERATOR_DELETE`

### 2. Studio Roles & Scoped Permissions (`studio-service`)
- **Studio Roles:** `OWNER`, `EDITOR`, `WRITER`, `ILLUSTRATOR`, `TRANSLATOR`
- **Studio Permissions:**
  - `STUDIO_POST_CREATE`
  - `NOVEL_READ`, `NOVEL_LIST`, `NOVEL_CREATE`, `NOVEL_EDIT`, `NOVEL_DELETE`, `NOVEL_DELETE_CANCEL`, `NOVEL_PUBLISH`
  - `CHAPTER_READ`, `CHAPTER_CREATE`, `CHAPTER_METADATA_EDIT`, `CHAPTER_EDIT_PUBLISHED`, `CHAPTER_TEXT_EDIT`, `CHAPTER_ILLUSTRATION_EDIT`, `CHAPTER_DELETE`, `CHAPTER_PUBLISH`, `CHAPTER_SCHEDULE`, `CHAPTER_SCHEDULE_CANCEL`

### 3. Frontend RBAC Helpers & Route Guards
- `usePermission(perm: PermissionType)`: Reactive hook checking current user's JWT permission set or admin bypass.
- `useIsCreator()`: Checks whether user has activated `creatorStatus: ACTIVE`.
- `<Can permission="..." requiresCreator>`: Conditionally renders UI actions/buttons.
- `<RequirePermission permission="..." requiresCreator>`: Route guard blocking direct URL access with a clean `403 / Access Restricted` page.
- `<ProtectedRoute>`: Redirects unauthenticated visitors to `/login`, preserving return path.

---

## 🚀 Key Feature Highlights

### 1. Reader & Discover Experience
- **Discover / Home (`/`):** Live keyword search, genre filter chips, category toggle (Fiction / Non-fiction), Trending and New Releases rows, and a "Continue Reading" shelf for saved library items.
- **Novel Detail (`/novels/:novelId`):** Hero cover display, synopsis, tags, Studio author details with follow action, like counter, and table of contents.
- **Distraction-Free Reader (`/novels/:novelId/chapters/:chapterId`):**
  - Ordered block rendering (text prose and responsive illustrations).
  - Top scroll reading progress bar.
  - Reader appearance controls (font size: A- / A / A+, line height: normal / relaxed / loose, theme: default / sepia warm / dark).
  - Previous / Next chapter navigation.
  - **Preview Limit Enforcement:** Unauthenticated readers browsing beyond chapter 5 are greeted with an elegant unlock / sign-in card.

### 2. Authentication Flow
- Real 3-step registration matching the backend OTP challenge:
  1. Email submission (`POST /api/v1/identity/register/send-otp`)
  2. 6-digit OTP verification with auto-focusing numeric input boxes, paste handling, and 60-second resend timer (`POST /api/v1/identity/register/verify-otp`)
  3. Profile setup with optional avatar upload and password creation (`POST /api/v1/identity/register`)
- Login with identifier (username or email) and password (`POST /api/v1/identity/auth/login`).
- Silent refresh token rotation with HTTP-only cookies and automatic request replay.
- Password recovery flow with OTP verification and reset (`POST /api/v1/identity/auth/forgot-password`).

### 3. Creator Studio (`/studio`)
- **Dashboard:** 28-day readership trend chart using `recharts`, live follower count, published novel count, and quick "Continue Writing" jump.
- **Studio Switcher & Creation:** Multi-studio support allowing authors to manage distinct imprints/studios.
- **Novel Management (`/studio/novels`):** Create, update, publish, and soft-delete novels (with 30-day restore capability).
- **Chapter List (`/studio/novels/:novelId/chapters`):** Manage serialized chapters, publishing lifecycle, and deletion.

### 4. Notion-Style Chapter Editor (`/studio/novels/:novelId/chapters/:chapterId/edit`)
- **Unlimited polymorphic block ordering:** Mix prose text blocks and illustration blocks freely in any sequence.
- **Subtle '+' block inserter:** Positioned between every two blocks and at the bottom.
- **Hover toolbar per block:** Drag-and-drop reordering with `@dnd-kit`, Move Up, Move Down, Duplicate, and Delete.
- **Auto-growing text areas:** Clean prose editing without awkward scrollbars.
- **File Upload Illustration Blocks:** Drag-and-drop or file picker with live preview, upload progress, and caption/alt text inputs — **strictly no URL input field**.
- **Debounced Autosave (1500ms):** Visual indicator ("All changes saved" / "Saving changes..."), with `beforeunload` unsaved changes warning.
- **Live Reader Preview Toggle:** One-click preview identical to the reader view.

### 5. Unified ImageKit Upload Pipeline (`useImageUpload` & `<ImageUploader />`)
- Single, robust implementation reused across:
  - User avatar upload
  - Profile banner upload
  - Novel cover art
  - Chapter illustration blocks
  - Community post attachments
- Client-side validation: Max 5 MB, supported formats (`image/jpeg`, `image/png`, `image/webp`).
- Client upload directly to ImageKit; only the resulting URL string is saved to backend entities.
- ImageKit thumbnail transformation helper (`getImageKitUrl(url, width, height)`).

### 6. Social Community & Library
- **Community Feed (`/community`):** Public posts from creators and studios, with like, share, and flat comments thread (create, edit, delete comments).
- **User Library (`/library`):** System-managed Watch Later collection plus user-created custom collections with item management.

### 7. Moderation & Admin
- **Moderation Area (`/moderation`):** Review reported content, take down flagged novels/comments, and dismiss reports.
- **Admin Console (`/admin`):** User accounts directory, role and permission reassignment, user account blocking/unblocking, and platform health telemetry.

---

## 🛠️ Project Structure

```
novelforge-client/
├── docs/
│   └── frontend-contract.md    # Exhaustive API contract & backend investigation
├── src/
│   ├── api/                    # Typed API clients (identity, novel, studio, engagement)
│   │   ├── client.ts           # Axios instance with 401 refresh & 403 interceptor
│   │   ├── identity.ts
│   │   ├── novel.ts
│   │   ├── studio.ts
│   │   └── engagement.ts
│   ├── components/             # Reusable UI primitives
│   │   ├── auth/               # <Can /> component
│   │   ├── common/             # 403 ForbiddenPage
│   │   ├── editor/             # SortableBlock, TextBlock, IllustrationBlock, BlockInserter
│   │   ├── engagement/         # PostCard with comments & likes
│   │   ├── layout/             # Navbar, Footer, AppLayout
│   │   ├── novel/              # NovelCard
│   │   └── ui/                 # ImageUploader, Modal, Skeleton, EmptyState, ErrorState, Toast
│   ├── features/               # Domain feature modules
│   │   ├── admin/              # Global admin console
│   │   ├── auth/               # Login, Register (3-step OTP), ForgotPassword, CreatorOnboarding
│   │   ├── community/          # Social community feed
│   │   ├── discover/           # Reader discover/home
│   │   ├── editor/             # Notion-style Chapter Block Editor
│   │   ├── library/            # Saved library & collections
│   │   ├── moderation/         # Content moderation center
│   │   ├── novel/              # Novel detail page
│   │   ├── profile/            # User/creator profile
│   │   ├── reader/             # Distraction-free chapter reader
│   │   └── studio/             # Studio layout, dashboard, novels CRUD, chapters list, settings
│   ├── hooks/                  # usePermission, useImageUpload
│   ├── lib/                    # ImageKit helper, theme store, utility functions
│   ├── routes/                 # ProtectedRoute, RequirePermission, PublicOnlyRoute, router
│   ├── store/                  # authStore (Zustand), toastStore
│   └── types/                  # Generated TypeScript interfaces mirroring backend DTOs
├── tailwind.config.js          # Design system CSS variables & tokens
├── postcss.config.js
├── tsconfig.json               # Strict TypeScript configuration
└── vite.config.ts              # Vite configuration with '@/' path alias
```

---

## ⚙️ Environment Variables

Create a `.env` file in `novelforge-client`:

```env
# API Gateway entry point (default: http://localhost:8080)
VITE_API_BASE_URL=http://localhost:8080

# ImageKit credentials for direct client uploads
VITE_IMAGEKIT_PUBLIC_KEY=public_novelforge_demo
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/novelforge

# Enable fallback mocks for scaffolded/missing backend endpoints
VITE_USE_MOCKS=false
```

---

## 💻 Development & Build Scripts

```bash
# Navigate to client workspace
cd novelforge-client

# Run strict TypeScript type check
npx tsc --noEmit

# Run local development server
npm run dev

# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```
