# NovelForge Render Deployment Guide

This guide documents the repository's `render.yaml` Blueprint configuration. It is not evidence that the full stack is currently deployed or production-ready. Render plan availability, resource limits, pricing, and managed-service behavior can change; verify them in the Render dashboard before deploying.

---

## 🌟 Architecture & Services

The Blueprint describes these services and managed resources:

1. **Managed PostgreSQL**: Relational database for `identity-service`, `novel-service`, `studio-service`, and `engagement-service`.
2. **Managed Key-Value Store (Redis)**: Cache, token blacklist, and rate limiter storage.
3. **Eureka Server**: Centralized service discovery on the Render internal private network.
4. **API Gateway**: Edge routing, rate limiting, and reverse proxy for all client requests.
5. **Microservices**:
   - `identity-service` (Port: `8081`): Authentication, user accounts, JWT issuance, password reset, and session state.
   - `notification-service` (Port: `8082`): Email OTP verification via Brevo / SMTP with actuator health check.
   - `novel-service` (Port: `8083`): Novels, chapters, metadata (PostgreSQL) and chapter content blocks (MongoDB).
   - `engagement-service` (Port: `8084`): Likes, comments, posts, follows, feeds, and collections.
   - `studio-service` (Port: `8087`): Creator studios, collaborator invites, permissions, and novel authoring studio.
6. **Frontend Web App (`novelforge-client`)**: React 19 + Vite served through high-performance Nginx on port `80`.

Admin and moderation APIs are hosted by `identity-service`; they are not separate deployables. `notification-service` handles asynchronous OTP email only. Studio invitations are listed from persisted studio memberships through the Studio API and client Inbox.

---

## JVM and Resource Settings in the Blueprint

The production profiles and Blueprint declare JVM memory, thread, and connection limits. These are configuration values, not measured RSS guarantees; verify container memory and CPU in the target environment before selecting plans.

### 1. Configured JVM Limits
Default JVM limits can exceed small container budgets when combined with native memory, thread stacks, and framework overhead. The values below are the repository's configured caps, not a guarantee of safe memory use for every workload.

NovelForge enforces the following calibrated `JAVA_OPTS`:
```bash
-Xms96m -Xmx200m -XX:MaxMetaspaceSize=110m -XX:ReservedCodeCacheSize=48m -Xss256k -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom
```

| Memory Area | Default Java 21 | NovelForge Tuned Spec | Benefit |
|---|---|---|---|
| **Max Heap (`-Xmx`)** | 25% of RAM (~128MB) or unconstrained | `200MB` (Eureka/Notification: `160MB`) | Guaranteed upper bound on dynamic allocations |
| **Initial Heap (`-Xms`)** | Dynamic | `96MB` (Eureka/Notification: `64MB`) | Fast startup without excessive memory reservation |
| **Metaspace (`-XX:MaxMetaspaceSize`)** | Unlimited | `110MB` (Eureka/Notification: `96MB`) | Prevents unbounded class metadata memory growth |
| **Code Cache (`-XX:ReservedCodeCacheSize`)** | `240MB` | `48MB` (Eureka/Notification: `32MB`) | Frees ~190MB of virtual & physical memory |
| **Thread Stacks (`-Xss`)** | `1024KB` (1MB) per thread | `256KB` per thread | Reduces 50 threads from 50MB down to 12.5MB |
| **Garbage Collector** | G1GC (Multi-threaded) | **Serial GC (`-XX:+UseSerialGC`)** | Eliminates 50MB of RSet metadata & prevents CPU thrashing on 0.1 vCPU |
| **Direct Memory** | Unlimited | `64MB` (`MaxDirectMemorySize` on Gateway) | Caps Netty byte buffer allocations |
| **Total RSS** | Workload-dependent | Not measured by this configuration table | Measure on the selected plan |

### 2. Thread Pool & Connection Limits (`application-prod.yml` / `.yaml`)
- **HikariCP Database Connections**: Capped at `maximum-pool-size: 3`, `minimum-idle: 1`. Prevents pool exhaustion on Render free tier PostgreSQL and reduces memory buffers.
- **Embedded Tomcat Threads**: Capped at `server.tomcat.threads.max: 20` and `min-spare: 2` (default is 200).
- **Netty IO Worker Threads**: Capped at `-Dio.netty.eventLoopThreads=2 -Dreactor.netty.ioWorkerCount=2` in API Gateway.
- **Dynamic Port Binding**: Docker entrypoints dynamically bind to Render's injected `$PORT` (`-Dserver.port=${PORT:-<default>}`).
- **Database URL Auto-Conversion**: Services connecting to PostgreSQL automatically convert Render's `postgresql://` URI into Spring JDBC `jdbc:postgresql://` format.
- **Actuator Health Probes**: `/actuator/health` probes are configured with non-blocking checks to prevent premature container eviction during initial startup on 0.1 vCPU.

---

## Apply the Blueprint

### Step 1: Push Repository to GitHub / GitLab
Ensure all changes, including `render.yaml`, `application-prod.*`, and `.env.production` files, are pushed to your repository.

### Step 2: Create Blueprint on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your repository (`novelforge-server`).
4. Render will automatically detect and parse [`render.yaml`](./render.yaml).

### Step 3: Configure Secrets in Render Dashboard
Render will prompt for environment variables marked `sync: false`. Supply unique high-entropy secrets; `JWT_SECRET_KEY` and `NOVELFORGE_SECURITY_JWT_SECRET_KEY` must be configured consistently across services that validate the same tokens:
- **`SPRING_MONGODB_URI`**: Your MongoDB connection string (e.g., from MongoDB Atlas Free M0).
- **`BREVO_API_KEY`**: Your Brevo API key for OTP delivery.
- **`BREVO_SENDER_EMAIL`**: Your verified Brevo sender email.
- **JWT and internal secrets**: `JWT_SECRET_KEY`, `NOVELFORGE_SECURITY_JWT_SECRET_KEY`, `GATEWAY_INTERNAL_SECRET`, `OTP_HMAC_SECRET`, and the service-specific internal keys. No committed defaults should be used.
- **Optional first-admin bootstrap**: `NOVELFORGE_ADMIN_DEFAULT_PASSWORD`. Set it only for initial provisioning when no admin exists; Identity BCrypt-hashes it. Remove the variable after the account is created. For an existing installation, use the authorized admin role-management flow.

### Step 4: Deploy
Click **Apply**. Render will attempt to provision the configured resources and services:
- Managed PostgreSQL and Redis Key-Value store
- Build the configured app services using their Dockerfiles
- Activate the `prod` profile and the JVM limits declared in the repository
- Connect internal private network hostnames and launch all containers

The Blueprint does not define an autoscaling policy or a validated production capacity target. The checked-in 1-3 instance measurements are local Docker benchmarks; see [docs/performance/CAPACITY_PROFILE.md](docs/performance/CAPACITY_PROFILE.md) and do not extrapolate them directly to Render.

---

## 🛠 Manual Individual Service Deployment on Render

If deploying services individually as Web Services instead of a Blueprint:

| Service | Runtime | Docker Context | Dockerfile Path | Internal Port | Memory Profile (`JAVA_OPTS`) |
|---|---|---|---|---|---|
| `novelforge-eureka-server` | Docker | `./eureka-server` | `./eureka-server/Dockerfile` | `8761` | `-Xms64m -Xmx160m -XX:MaxMetaspaceSize=96m -XX:ReservedCodeCacheSize=32m -Xss256k -XX:+UseSerialGC` |
| `novelforge-api-gateway` | Docker | `./api-gateway` | `./api-gateway/Dockerfile` | `8080` | `-Xms96m -Xmx200m -XX:MaxMetaspaceSize=110m -XX:ReservedCodeCacheSize=48m -Xss256k -XX:+UseSerialGC` |
| `novelforge-identity-service` | Docker | `.` (Root) | `./identity-service/Dockerfile` | `8081` | `-Xms96m -Xmx200m -XX:MaxMetaspaceSize=110m -XX:ReservedCodeCacheSize=48m -Xss256k -XX:+UseSerialGC` |
| `novelforge-notification-service` | Docker | `.` (Root) | `./notification-service/Dockerfile` | `8082` | `-Xms64m -Xmx160m -XX:MaxMetaspaceSize=96m -XX:ReservedCodeCacheSize=32m -Xss256k -XX:+UseSerialGC` |
| `novelforge-novel-service` | Docker | `.` (Root) | `./novel-service/Dockerfile` | `8083` | `-Xms96m -Xmx200m -XX:MaxMetaspaceSize=110m -XX:ReservedCodeCacheSize=48m -Xss256k -XX:+UseSerialGC` |
| `novelforge-engagement-service` | Docker | `.` (Root) | `./engagement-service/Dockerfile` | `8084` | `-Xms96m -Xmx200m -XX:MaxMetaspaceSize=110m -XX:ReservedCodeCacheSize=48m -Xss256k -XX:+UseSerialGC` |
| `novelforge-studio-service` | Docker | `.` (Root) | `./studio-service/Dockerfile` | `8087` | `-Xms96m -Xmx200m -XX:MaxMetaspaceSize=110m -XX:ReservedCodeCacheSize=48m -Xss256k -XX:+UseSerialGC` |
| `novelforge-client` | Docker | `./novelforge-client` | `./novelforge-client/Dockerfile` | `80` | Nginx Static (~10MB RAM) |

> **Important**: For `identity-service`, `notification-service`, `novel-service`, `engagement-service`, and `studio-service`, the Docker context **must be the repository root (`.`)** because they depend on local shared modules (`novelforge-common` and `novelforge-security`). Ensure your Render build context is set to `.` for these services.

---

## Deployment Configuration References

The checked-in deployment inputs are the root `render.yaml` and the following example files. Secret-bearing `.env` files are intentionally not committed:

- `eureka-server/.env.production.example`
- `api-gateway/.env.production.example`
- `identity-service/.env.production.example`
- `notification-service/.env.production.example`
- `novel-service/.env.production.example`
- `studio-service/.env.production.example`
- `engagement-service/.env.production.example`
- `novelforge-client/.env.production.example`
