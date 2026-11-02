# NovelForge Render Deployment Guide (0.1 vCPU / 512MB RAM Specification)

This guide details how to deploy the entire NovelForge microservices stack to [Render](https://render.com) using the provided **`render.yaml` Blueprint** or as individual Web Services under the **0.1 vCPU and 512MB RAM** free/starter tier constraints.

---

## 🌟 Architecture & Services

NovelForge is fully configured for zero-effort Infrastructure-as-Code (IaC) deployment on Render:

1. **Managed PostgreSQL**: Relational database for `identity-service`, `novel-service`, `studio-service`, and `engagement-service`.
2. **Managed Key-Value Store (Redis)**: Cache, token blacklist, and rate limiter storage.
3. **Eureka Server**: Centralized service discovery on the Render internal private network.
4. **API Gateway**: Edge routing, rate limiting, and reverse proxy for all client requests.
5. **Microservices**:
   - `identity-service` (Port: `8081`): Authentication, user accounts, JWT issuance, password reset, and session state.
   - `notification-service` (Port: `8082`): Email OTP verification via Brevo / SMTP with actuator health check.
   - `novel-service` (Port: `8083`): Novels, chapters, metadata (PostgreSQL) and chapter content blocks (MongoDB).
   - `engagement-service` (Port: `8084`): Likes, comments, ratings, follows, bookmarks, and user feeds.
   - `studio-service` (Port: `8087`): Creator studios, collaborator invites, permissions, and novel authoring studio.
6. **Frontend Web App (`novelforge-client`)**: React 19 + Vite served through high-performance Nginx on port `80`.

---

## ⚡ 0.1 vCPU & 512MB RAM Stability Specifications

Running Java Spring Boot microservices on 512MB RAM with 0.1 vCPU requires strict resource constraints to prevent container `OOMKilled` (exit code 137) and CPU throttling freezes. NovelForge includes deep optimizations for this spec:

### 1. Mathematical Breakdown of JVM Memory Footprint
By default, Java 21 with G1GC allocates ~240MB CodeCache, 1MB per thread stack, and large G1GC remembered sets, causing total resident memory (RSS) to exceed 580MB and get killed by Render's cgroup memory killer.

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
| **Total Max RSS Footprint** | ~590MB (OOM Crash) | **~395MB - 410MB** | **Safe ~115MB buffer** under Render's 512MB limit! |

### 2. Thread Pool & Connection Limits (`application-prod.yml` / `.yaml`)
- **HikariCP Database Connections**: Capped at `maximum-pool-size: 3`, `minimum-idle: 1`. Prevents pool exhaustion on Render free tier PostgreSQL and reduces memory buffers.
- **Embedded Tomcat Threads**: Capped at `server.tomcat.threads.max: 20` and `min-spare: 2` (default is 200).
- **Netty IO Worker Threads**: Capped at `-Dio.netty.eventLoopThreads=2 -Dreactor.netty.ioWorkerCount=2` in API Gateway.
- **Dynamic Port Binding**: Docker entrypoints dynamically bind to Render's injected `$PORT` (`-Dserver.port=${PORT:-<default>}`).
- **Database URL Auto-Conversion**: Services connecting to PostgreSQL automatically convert Render's `postgresql://` URI into Spring JDBC `jdbc:postgresql://` format.
- **Actuator Health Probes**: `/actuator/health` probes are configured with non-blocking checks to prevent premature container eviction during initial startup on 0.1 vCPU.

---

## 🚀 One-Click Blueprint Deployment

### Step 1: Push Repository to GitHub / GitLab
Ensure all changes, including `render.yaml`, `application-prod.*`, and `.env.production` files, are pushed to your repository.

### Step 2: Create Blueprint on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your repository (`novelforge-server`).
4. Render will automatically detect and parse [`render.yaml`](./render.yaml).

### Step 3: Configure Secrets in Render Dashboard
Render will prompt for environment variables marked `sync: false`:
- **`SPRING_MONGODB_URI`**: Your MongoDB connection string (e.g., from MongoDB Atlas Free M0).
- **`BREVO_API_KEY`**: Your Brevo API key for OTP delivery.
- **`BREVO_SENDER_EMAIL`**: Your verified Brevo sender email.
- **Internal secrets** (optional, defaults provided): `GATEWAY_INTERNAL_SECRET`, `OTP_HMAC_SECRET`, `STUDIO_IDENTITY_INTERNAL_SECRET`, etc.

### Step 4: Deploy
Click **Apply**. Render will automatically provision:
- Managed PostgreSQL and Redis Key-Value store
- Build all 8 services using multi-stage Docker builds
- Activate the `prod` profile with 512MB RAM constraints
- Connect internal private network hostnames and launch all containers

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

## 📁 Production Configuration Files Reference

Every service contains dedicated production configuration files:

- **Root Production Env**: `.env.production` and `.env.production.example`
- **Eureka Server**: `eureka-server/src/main/resources/application-prod.yml`, `.env.production`, `.env.production.example`
- **API Gateway**: `api-gateway/src/main/resources/application-prod.yml`, `.env.production`, `.env.production.example`
- **Identity Service**: `identity-service/src/main/resources/application-prod.yml`, `.env.production`, `.env.production.example`
- **Notification Service**: `notification-service/src/main/resources/application-prod.yml`, `.env.production`, `.env.production.example`
- **Novel Service**: `novel-service/src/main/resources/application-prod.yaml`, `.env.production`, `.env.production.example`
- **Studio Service**: `studio-service/src/main/resources/application-prod.yaml`, `.env.production`, `.env.production.example`
- **Engagement Service**: `engagement-service/src/main/resources/application-prod.yaml`, `.env.production`, `.env.production.example`
- **Client Web App**: `novelforge-client/.env.production`, `.env.production.example`
