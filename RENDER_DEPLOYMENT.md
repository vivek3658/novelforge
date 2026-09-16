# NovelForge Render Deployment Guide

This guide details how to deploy the entire NovelForge microservices stack to [Render](https://render.com) using the provided **`render.yaml` Blueprint** and optimized Docker containers.

---

## 🌟 Overview

NovelForge is fully configured for zero-effort Infrastructure-as-Code (IaC) deployment on Render. The Blueprint sets up:

1. **Managed PostgreSQL**: Relational database for `identity-service` and `novel-service`.
2. **Managed Key-Value (Redis)**: Cache and session store for JWT token blacklist & registration states.
3. **Eureka Server**: Centralized service discovery on Render internal network.
4. **API Gateway**: Edge routing and reverse proxy for all client requests.
5. **Microservices**:
   - `identity-service` (Authentication & User management)
   - `novel-service` (Novels, Chapters & Content)
   - `notification-service` (Email OTP verification)
6. **Frontend Web App (`novelforge-client`)**: React 19 + Vite served through high-performance Nginx.

---

## 🚀 One-Click Blueprint Deployment

### Step 1: Push to GitHub / GitLab
Ensure your repository with `render.yaml` is pushed to GitHub or GitLab.

### Step 2: Create Blueprint on Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your repository (`novelforge-server`).
4. Render will automatically detect and parse [`render.yaml`](./render.yaml).

### Step 3: Configure Secrets (Optional)
Render will prompt for any environment variables marked `sync: false`:
- **`SPRING_MAIL_USERNAME`**: Your SMTP email address for OTP delivery.
- **`SPRING_MAIL_PASSWORD`**: Your SMTP app password.

### Step 4: Deploy
Click **Apply**. Render will automatically provision:
- The PostgreSQL database & Redis instance
- Build all Docker images using multi-stage builds
- Link internal hostnames and start the services

---

## ⚡ Free Tier Optimizations Included

The Dockerfiles and Blueprint have been specifically tuned for cloud free-tier constraints (e.g., Render 512MB RAM):
- **JVM Heap Memory Limits**: Default `-Xmx350m -Xms200m` via `JAVA_OPTS` to prevent `OOMKilled` crashes on 512MB containers.
- **Dynamic Port Binding**: Services bind dynamically to the Render assigned `$PORT` via `-Dserver.port=${PORT:-<default>}`.
- **Database URL Auto-Conversion**: `identity-service` and `novel-service` entrypoints automatically convert Render's `postgresql://` connection strings into JDBC format (`jdbc:postgresql://`).
- **Nginx SPA Routing & Gzip**: `novelforge-client` includes gzip compression and HTML5 history mode routing fallback.
- **Multi-Stage Docker Builds**: Slim Alpine runtime images (~200MB) with non-root user execution (`spring:spring`).

---

## 🛠 Manual Individual Service Deployment on Render

If deploying services individually as Web Services instead of a Blueprint:

| Service | Runtime | Docker Context | Dockerfile Path | Default Internal Port |
|---|---|---|---|---|
| `eureka-server` | Docker | `./eureka-server` | `./eureka-server/Dockerfile` | `8761` |
| `api-gateway` | Docker | `./api-gateway` | `./api-gateway/Dockerfile` | `8080` |
| `identity-service` | Docker | `.` (Root) | `./identity-service/Dockerfile` | `8081` |
| `novel-service` | Docker | `.` (Root) | `./novel-service/Dockerfile` | `8083` |
| `notification-service` | Docker | `./notification-service` | `./notification-service/Dockerfile` | `8082` |
| `novelforge-client` | Docker | `./novelforge-client` | `./novelforge-client/Dockerfile` | `80` |

> **Note**: For `identity-service` and `novel-service`, the Docker context **must be the repository root (`.`)** because they depend on local shared modules (`novelforge-common` and `novelforge-security`).
