# NovelForge Client

NovelForge's browser client is a React 19 JSX application built with Vite and React Router. The API layer uses the browser `fetch` API from `src/services/api.js`; this package does not use TypeScript, Tailwind, Axios, TanStack Query, or Zustand.

## Run locally

Start the backend stack from the repository root with Docker Compose, then run the client:

```powershell
Set-Location novelforge-client
Copy-Item .env.example .env
npm install
npm run dev
```

The Vite development server uses `VITE_API_BASE_URL` from `.env.example` and defaults to the API Gateway at `http://localhost:8080`. Configure valid ImageKit public upload settings before testing image uploads. Never place the ImageKit private key or service credentials in the client environment.

Available checks:

```powershell
npm run lint
npm run build
npm run preview
```

## Main routes

| Route | Purpose | Access |
|---|---|---|
| `/` | Home and discovery | Public |
| `/novels`, `/trending`, `/categories` | Catalog and browsing | Public |
| `/novels/:novelId` | Novel details and table of contents | Public |
| `/novels/:novelId/read/:chapterId` | Chapter reader | Public, subject to backend access rules |
| `/community` | Public creator/studio posts | Public |
| `/login`, `/register`, `/forgot-password` | Authentication flows | Signed out |
| `/profile`, `/me`, `/library` | Profile and saved reading | Signed in |
| `/studio` | Creator dashboard, novel/chapter authoring, team | Signed in |
| `/inbox` | Pending studio invitations and accept action | Signed in |
| `/admin`, `/moderation` | Staff UI backed by Identity APIs | Signed in and authorized by backend |

## API and authoring behavior

All browser requests use the shared API client and the gateway. The client handles access-token attachment and one refresh retry after an eligible `401`. Service prefixes and request/response contracts are documented in the repository [API.md](../API.md).

The writer workspace lives inside `/studio`. The chapter list and new-chapter action are visible when the chapter editor opens; selecting a chapter loads its editable draft. Novel metadata updates use the existing `PUT /api/v1/novels/novels/{novelId}` gateway route.

The Inbox lists persisted studio membership invitations via `GET /api/v1/studios/invitations/me`. Accepting an invitation updates the membership through the Studio API. The separate notification service remains an OTP email consumer; it does not provide a general notification feed.
