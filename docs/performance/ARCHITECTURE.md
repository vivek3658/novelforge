# NovelForge Microservices Architecture & Discovery Analysis

This document records the repository-backed backend topology, service dependencies, and the local performance-test configuration. It describes measured local test scenarios, not a production deployment or capacity guarantee.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    Client(["Load Generator / Autocannon Client"])

    subgraph Edge ["Edge & Discovery Layer"]
        Gateway["API Gateway<br/>(Spring Cloud Gateway / Netty :8080)"]
        Eureka["Eureka Discovery Server<br/>(Netflix Eureka :8761)"]
    end

    subgraph Services ["Application Microservices"]
        Identity["Identity Service<br/>(Tomcat :8081)"]
        Novel["Novel Service<br/>(Tomcat :8083)"]
        Studio["Studio Service<br/>(Tomcat :8087)"]
        Engagement["Engagement Service<br/>(Tomcat :8084)"]
        Notification["Notification Service<br/>(Tomcat :8082<br/><i>Excluded from load matrix</i>)"]
    end

    subgraph DataInfra ["Persistence & Caching Infrastructure"]
        Postgres[("PostgreSQL 16<br/>userDB / novelDB / engagementDB / studioDB")]
        Mongo[("MongoDB 7<br/>novelforge_chapters")]
        Redis[("Redis 7 Alpine<br/>Rate Limiting, OTP, Novel/Post Cache")]
        Rabbit[("RabbitMQ 4<br/>Broker & Exchanges")]
        Mailpit["Mailpit Local SMTP<br/>(:1025 / :8025)"]
    end

    %% Edge connections
    Client -->|HTTP / JSON| Gateway
    Gateway -.->|Heartbeat / Registry| Eureka
    Identity -.->|Register| Eureka
    Novel -.->|Register| Eureka
    Studio -.->|Register| Eureka
    Engagement -.->|Register| Eureka
    Notification -.->|Register| Eureka

    %% Gateway Routing
    Gateway -->|/api/v1/identity/**| Identity
    Gateway -->|/api/v1/novels/**| Novel
    Gateway -->|/api/v1/studios/**| Studio
    Gateway -->|/api/v1/engagement/**| Engagement
    Gateway -.->|Rate Limiting Keys| Redis

    %% Sync Inter-service dependencies
    Novel -->|Verify Studio Membership<br/>Internal Secret| Studio
    Studio -->|Verify Creator Eligibility<br/>Internal Secret| Identity
    Engagement -->|Validate Studio/Author<br/>Internal Secret| Studio
    Engagement -->|Validate User/Author<br/>Internal Secret| Identity
    Engagement -->|Validate Novel/Target<br/>Internal Secret| Novel

    %% Async event publishing
    Identity -->|Publish OtpEmailRequestedEvent| Rabbit
    Engagement -->|Publish Feed Fanout Events| Rabbit
    Rabbit -->|Consume OTP Queue| Notification

    %% Notification Delivery
    Notification -->|Local SMTP (Isolated)| Mailpit

    %% Datastore connections
    Identity -->|JDBC| Postgres
    Identity -->|Lettuce| Redis
    Studio -->|JDBC| Postgres
    Studio -->|Lettuce| Redis
    Novel -->|JDBC (Metadata)| Postgres
    Novel -->|Reactive/Sync Mongo (Blocks)| Mongo
    Novel -->|Lettuce (30s Cache)| Redis
    Engagement -->|JDBC| Postgres
    Engagement -->|Lettuce (30s Cache)| Redis
    Notification -->|Lettuce (Idempotency Key)| Redis
```

---

## 2. Microservice Inventory & Dependencies

| Service | Container Port | Datastore(s) | Synchronous Dependencies | Asynchronous Dependencies | Auth Required | Registration / Discovery |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **api-gateway** | `8080` (Host: 8080) | Redis (Rate Limiter) | Identity, Novel, Studio, Engagement | None | Public gateway; forwards JWT | Eureka Client (`api-gateway`) |
| **identity-service** | `8081` (Internal) | PostgreSQL (`userDB`), Redis | None | Publishes `OtpEmailRequestedEvent` to RabbitMQ | Public for login/register; Bearer for profile | Eureka Client (`identity-service`) |
| **novel-service** | `8083` (Internal) | PostgreSQL (`novelDB`), MongoDB (`novelforge_chapters`), Redis (30s TTL cache) | Studio Service (`GET /studios/{studioId}/members/me`) | None | Public for `/novels/search`, `/novels/{id}`, `/novels/{id}/chapters/**`; Bearer for authoring | Eureka Client (`novel-service`) |
| **engagement-service** | `8084` (Internal) | PostgreSQL (`engagementDB`), Redis (30s TTL cache) | Studio Service, Identity Service, Novel Service | RabbitMQ exchange `novelforge.engagement.feed` | Public for `/public/posts/**`, comments/likes count; Bearer for feed/like/comment/share | Eureka Client (`engagement-service`) |
| **studio-service** | `8087` (Internal) | PostgreSQL (`studioDB`), Redis | Identity Service (`GET /internal/users/{id}/creator-eligibility`) | None | Bearer token + Studio Permissions | Eureka Client (`studio-service`) |
| **notification-service** *(Excluded)* | `8082` (Internal) | Redis (Dedup status keys) | Identity Service (`GET /internal/otp-challenges/{id}`) | Consumes RabbitMQ queue `novelforge.notification.otp` | Internal secret | Eureka Client (`notification-service`) |

---

## 3. Gateway Routing, Load-Balancing & Scaling Dynamics

### Current Route Configuration
Spring Cloud Gateway routes in `api-gateway/src/main/resources/application.yml` define route destinations as dynamic expressions:
- `IDENTITY_SERVICE_URL: ${IDENTITY_SERVICE_URL:http://localhost:8081}`
- `NOVEL_SERVICE_URL: ${NOVEL_SERVICE_URL:http://localhost:8083}`
- `STUDIO_SERVICE_URL: ${STUDIO_SERVICE_URL:http://localhost:8087}`
- `ENGAGEMENT_SERVICE_URL: ${ENGAGEMENT_SERVICE_URL:http://localhost:8084}`

In `docker-compose.yml`, these are set to direct Docker container hostnames:
```yaml
IDENTITY_SERVICE_URL: http://identity-service:8081
NOVEL_SERVICE_URL: http://novel-service:8083
STUDIO_SERVICE_URL: http://studio-service:8087
ENGAGEMENT_SERVICE_URL: http://engagement-service:8084
```

Default Compose runs one instance of each service and uses direct Docker hostnames. The performance override changes gateway destinations to `lb://` Eureka routes and removes fixed container names where replicas are measured. Do not expect horizontal balancing from the default Compose URLs.

### Can the Gateway Spread Traffic Across Multiple Instances?
1. **With Static HTTP URIs (`http://novel-service:8083`)**:
   - Under standard Docker DNS, resolving `novel-service` returns multiple A records if scaled.
   - However, Reactor Netty's `HttpClient` in Spring Cloud Gateway maintains persistent connection pools. Once a connection to a specific resolved IP is established, subsequent requests on that keep-alive connection stick to **one container instance**.
   - **Result:** Scaling to 2 or 3 instances with static HTTP URIs will **not** achieve true per-request load-balancing.
2. **With Spring Cloud LoadBalancer (`lb://<SERVICE_NAME>`)**:
   - `api-gateway` has `ReactiveLoadBalancerClientFilter` loaded and active (verified via `/actuator/gateway/globalfilters`).
   - By setting `NOVEL_SERVICE_URL: lb://novel-service`, `IDENTITY_SERVICE_URL: lb://identity-service`, etc., Spring Cloud Gateway queries Eureka for each request and distributes incoming traffic across all healthy registered service instances using Round-Robin load balancing.

---

## 4. Gateway Settings Impacting Performance

1. **Rate Limiting (`RequestRateLimiter`)**:
   - Enabled only on 4 OTP endpoints:
     - `/api/v1/identity/register/send-otp` (10 req/s, burst 10)
     - `/api/v1/identity/auth/forgot-password` (10 req/s, burst 10)
     - `/api/v1/identity/register/verify-otp` (10 req/s, burst 10)
     - `/api/v1/identity/auth/forgot-password/verify` (10 req/s, burst 10)
   - Backed by Redis with `XForwardedRemoteAddressResolver`.
   - **Impact on load test:** None, because OTP registration flows are excluded from the test matrix to protect email provider quotas. Read, login, and social write paths have no rate limiting.
2. **Circuit Breakers & Timeouts**:
   - No circuit breakers (Resilience4j) are configured on gateway routes.
   - Default Netty response timeouts apply.
3. **Global Logging Filter (`DebugFilter`)**:
   - Every gateway request logs `log.info("gateway_request requestId={} method={} path={}", ...)`. Under high concurrency (>1,000 req/s), stdout log flushing can introduce minor CPU/IO contention on the gateway container.
4. **Identity Header Injection (`GatewayClientIdentityFilter`)**:
   - Injects `X-NF-Client-IP` and `X-NF-Gateway-Secret` into downstream requests. Stateless and runs in <0.1ms.

---

## 5. Current JVM, Container & Datastore Settings

| Service | JVM Memory Flags (`JAVA_OPTS`) | GC Algorithm | Container CPU / RAM Limits | Hikari Pool (`maximum-pool-size`) | Web Server & Thread Pool |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **api-gateway** | `-Xmx350m -Xms200m` | Default JVM | None in compose | N/A (Reactive Redis) | Reactor Netty (16 event loop threads) |
| **identity-service** | `-Xmx300m -Xms128m` | G1GC (`-XX:+UseG1GC`) | None in compose | **3** (min-idle: 1, timeout: 30s) | Embedded Tomcat (200 worker threads) |
| **novel-service** | `-Xmx300m -Xms128m` | G1GC (`-XX:+UseG1GC`) | None in compose | **10** (Hikari default) | Embedded Tomcat (200 worker threads) |
| **engagement-service** | `-Xmx350m -Xms200m` | Default JVM | None in compose | **10** (Hikari default) | Embedded Tomcat (200 worker threads) |
| **studio-service** | `-Xms200m -Xmx350m` | G1GC (`-XX:+UseG1GC`) | None in compose | **3** (min-idle: 1, timeout: 30s) | Embedded Tomcat (200 worker threads) |
| **notification-service** | `-Xmx350m -Xms200m` | Default JVM | None in compose | N/A (Redis + RabbitMQ) | Embedded Tomcat (200 worker threads) |

> [!WARNING]
> **Severe DB Connection Pool Bottlenecks**:
> Both `identity-service` and `studio-service` have `maximum-pool-size: 3`. Under 50 to 200 concurrent connections, tasks will rapidly queue waiting for connections from Hikari, causing latency spikes and connection acquisition timeouts (`SQLTransientConnectionException`).

---

## 6. Real API Endpoint Classification

### A. Public Read Endpoints (No Auth Required)
- `GET /api/v1/novels/search?query=&category=&genre=&tag=&page=0&size=20` (Paginated novel catalog search; cached in Redis with 30s TTL)
- `GET /api/v1/novels/{novelId}` (Novel metadata details; cached in Redis)
- `GET /api/v1/novels/{novelId}/chapters?page=0&size=20` (Chapter metadata list)
- `GET /api/v1/novels/{novelId}/chapters/{chapterId}` (Full chapter content with ordered MongoDB text and illustration blocks)
- `GET /api/v1/engagement/public/posts?page=0&size=20` (Public community feed)
- `GET /api/v1/engagement/public/posts/{postId}` (Single community post)
- `GET /api/v1/engagement/targets/{type}/{targetId}/likes/count` (Public like counts)
- `GET /api/v1/engagement/targets/{type}/{targetId}/comments?page=0&size=20` (Public comments)
- `GET /api/v1/engagement/follows/{type}/{targetId}/count` (Follower counter)

### B. Authenticated Read Endpoints (`Authorization: Bearer <JWT>`)
- `GET /api/v1/identity/auth/me` (Current user identity and token validation)
- `GET /api/v1/identity/profile/me` (Current user profile details)
- `GET /api/v1/identity/profile/{userId}` (Target profile with visibility rules)
- `GET /api/v1/engagement/follows/me` (List of creators/studios followed by current user)
- `GET /api/v1/engagement/feed?cursor=&size=20` (Personalized community feed)
- `GET /api/v1/engagement/library/watch-later` (Watch later novel collection)
- `GET /api/v1/engagement/library/collections` (User-created reading lists)
- `GET /api/v1/studios?page=0&size=20` (Studios accessible by authenticated creator)

### C. Write Endpoints
- `POST /api/v1/identity/auth/login` (Public; CPU-intensive BCrypt password hashing + JWT issue)
- `POST /api/v1/engagement/targets/{type}/{targetId}/likes` (Toggle like on novel, chapter, or post)
- `POST /api/v1/engagement/targets/{type}/{targetId}/comments` (Add user comment)
- `POST /api/v1/engagement/posts` (Create author community post)
- `PUT /api/v1/engagement/follows/{type}/{targetId}` (Follow author or studio)
- `POST /api/v1/studios/{studioId}/novels` (Create novel draft)
- `POST /api/v1/novels/{novelId}/chapters` (Create chapter draft)
- `POST /api/v1/novels/{novelId}/chapters/{chapterId}/blocks` (Append block to MongoDB)

---

## 7. External Dependency Isolation: Brevo Email (Hard Rule)

### Paths That Trigger Email Dispatch
1. `POST /api/v1/identity/register/send-otp` -> Generates registration OTP -> Publishes `OtpEmailRequestedEvent` ("REGISTRATION") to RabbitMQ.
2. `POST /api/v1/identity/auth/forgot-password` -> Generates password reset OTP -> Publishes `OtpEmailRequestedEvent` ("PASSWORD_RESET") to RabbitMQ.

### Neutralization in Performance Setup
- **Strict Endpoint Exclusion**: No registration or OTP endpoints will be called during load tests. Test users are pre-seeded directly into PostgreSQL, and scenarios authenticate via `POST /api/v1/identity/auth/login`.
- **Provider Redirection to Local Mailpit**: In `docker-compose.perf.yml`, `notification-service` is configured with:
  ```yaml
  NOTIFICATION_EMAIL_PROVIDER: smtp
  SPRING_MAIL_HOST: mailpit
  SPRING_MAIL_PORT: 1025
  BREVO_API_KEY: disabled-perf-no-brevo
  ```
- **External API Boundary Check**: `https://api.brevo.com` is completely unreachable from the perf test environment. Real Brevo credentials are never passed.
- **Service Exclusion**: `notification-service` is kept at 1 instance and excluded from the scaling matrix.

---

## 8. Default Compose Limits and Performance Override

The following are limitations of the default local topology and the corresponding settings already present in `docker-compose.perf.yml`:

| Blocker | Root Cause | Impact | Solution in `docker-compose.perf.yml` |
| :--- | :--- | :--- | :--- |
| **Static `container_name`** | `container_name: novel-service` etc. in `docker-compose.yml` | Docker Compose throws conflict error on `--scale novel-service=2` | Omit `container_name` in the perf override file |
| **Eureka Instance ID Collision** | `eureka.instance.instance-id: ${spring.application.name}:${server.port}` | Scaled instances register with identical IDs (`novel-service:8083`), overwriting each other | Override `EUREKA_INSTANCE_INSTANCE_ID: ${HOSTNAME}:${spring.application.name}:${server.port}` |
| **Static Gateway Service URIs** | Gateway routes point to static `http://novel-service:8083` | Reactor Netty pools persistent connections to a single container IP | Set `NOVEL_SERVICE_URL: lb://novel-service`, `IDENTITY_SERVICE_URL: lb://identity-service`, etc. |
| **Unbounded Container Resources** | No `deploy.resources.limits` in compose | Containers can consume entire host CPU/RAM unevenly | Enforce uniform limits: `cpus: '1.0'`, `memory: '768M'` per service instance |
| **Hikari Connection Starvation** | `maximum-pool-size: 3` in Identity & Studio | Scaled instances contend heavily on 3 connections | Note as architectural bottleneck; report impact during scaling |
