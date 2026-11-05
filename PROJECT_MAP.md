# NovelForge Project Map

Last verified: 2026-11-05. This file describes the checked-in application and deployment configuration, not a future roadmap.

## Product

NovelForge is a reader and creator platform for serialized fiction. The implemented journeys include account registration/login, novel discovery and reading, studio-based novel and chapter authoring, community engagement, and studio collaboration invitations.

## Runtime inventory

| Component | Responsibility | Runtime / data |
|---|---|---|
| `novelforge-client` | React browser app, including the writer workspace and invitation Inbox | Vite; Docker serves the build with Nginx |
| `api-gateway` | Browser edge, path rewriting, OTP rate limits | Spring Cloud Gateway, host port `8080` |
| `identity-service` | Accounts, JWT, profiles, creator status, admin and moderation APIs | Spring Boot; `userDB`, Redis |
| `novel-service` | Novel metadata, chapter lifecycle, ordered chapter blocks | Spring Boot; `novelDB`, MongoDB, Redis |
| `studio-service` | Studios, permissions, memberships, invitations | Spring Boot; `studioDB` |
| `engagement-service` | Likes, comments, posts, follows, feeds, collections | Spring Boot; `engagementDB`, RabbitMQ |
| `notification-service` | Asynchronous OTP email delivery | RabbitMQ consumer; configured SMTP or Brevo adapter; no browser inbox API |
| `eureka-server` | Service registry | Eureka on port `8761` |
| `novelforge-common`, `novelforge-security` | Shared Java types and security utilities | Maven modules used by backend builds |

Admin and moderation are Identity API areas, not separate deployables. There is no `admin-service` or `moderation-service` in the Compose or Render runtime. AI and analytics services are also not part of the current deployment.

## System picture

```text
Browser -> React/Vite -> API Gateway -> Identity | Novel | Studio | Engagement
                                      Identity -> RabbitMQ -> Notification -> Email provider
                                      Engagement -> RabbitMQ (feed fanout)

PostgreSQL hosts userDB, novelDB, studioDB and engagementDB.
MongoDB stores chapter documents; Redis supports cache, short-lived state and rate limits.
Studio invitations are persisted as membership records and listed in the protected client Inbox.
```

## Local and benchmark topology

`docker-compose.yml` runs one instance of each service by default. Its gateway uses direct Docker service URLs. `docker-compose.perf.yml` changes supported gateway destinations to Eureka `lb://` routes, removes fixed container names where replicas are measured, and applies benchmark resource limits. Checked-in measurements cover selected workloads and 1-3 local service instances; they are not a production capacity guarantee or a universal maximum.

See [ARCHITECTURE.md](ARCHITECTURE.md), [README.md](README.md), [API.md](API.md), [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md), and [docs/performance/CAPACITY_PROFILE.md](docs/performance/CAPACITY_PROFILE.md) for architecture, setup, contracts, deployment and measured capacity.

## Current follow-up

Add browser-level smoke coverage for novel metadata updates, chapter selection/creation, and accepting studio invitations. Static inspection confirms the novel update route and DTO shape match the backend; capture the browser Network response to diagnose any remaining live update failure.
