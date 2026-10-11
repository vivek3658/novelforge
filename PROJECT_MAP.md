# NovelForge Project Map

Use this file as the current source of truth while working on the project. Update the status and "Next task" whenever a task is completed. Keep the project small enough to explain clearly.

## Product

NovelForge is a web app for readers to discover novels and for creators to publish them. The first complete user journey should be: register/login → browse/search novels → read novel details → creator creates and edits an owned novel.

## What is in the repository today

| Component | Current role | Reality check |
|---|---|---|
| `novelforge-client` | React web client | UI exists; verify each screen against live API before claiming complete |
| `api-gateway` | Edge routing and CORS | Routes identity, novels, notifications; current defaults point to hosted URLs |
| `identity-service` | Accounts, registration, JWT, profiles | Main backend service; security and flow fixes remain |
| `novel-service` | Novel metadata and search | Main domain service; owner authorization and deleted-record filtering need work |
| `notification-service` | OTP email delivery | Present; delivery failure handling needs correction |
| `eureka-server` | Service registry | Present; single instance |
| `novelforge-common`, `novelforge-security` | Shared Java libraries | Present; shared code increases cross-service coupling, so keep narrow |
| `engagement-service` | Planned interactions | Scaffold only |
| `ai-service` | Planned writing assistance | Scaffold only |
| `analytics-service` | Planned analytics | Scaffold only |
| `studio-service` | Planned creator experience | Scaffold only / in progress |

## System picture

```text
Browser (React)
    │ HTTP + access token
    ▼
API Gateway
    ├── Identity Service ── userDB + Redis
    ├── Novel Service ───── novelDB
    └── Notification Service ── email provider

Eureka provides service registration. Each domain service owns its data and API.
Future: Engagement Service owns ratings/comments/bookmarks; Analytics consumes events asynchronously.
```

## Current priority order

1. Make a reliable local run path and write down the exact steps and known limitations.
2. Remove secrets and sensitive logs; fix refresh-token validation and production cookie settings.
3. Add novel ownership and enforce it on update/delete; filter soft-deleted novels from every normal read.
4. Fix Compose service URLs/ports and notification endpoint paths.
5. Add focused tests for auth, ownership, soft deletion, and gateway routes; run them in CI.
6. Add DB migrations, then implement one engagement feature end to end if time remains.

Do not add more services or claim production readiness until the main user journey works and the priority items are addressed.

## Next task

Set this to the single concrete task currently being worked on. Update it before switching tasks.

**Next task: Fix local Docker Compose routing and document a verified end-to-end run.**

## Decision log

- Keep this a portfolio-sized application; prioritize a working vertical slice over more service names.
- Keep the current architecture understandable: identity owns users, novel service owns novels, and each service owns its data.
- Do not claim scale, reliability, production readiness, or user metrics without measurements and evidence.
