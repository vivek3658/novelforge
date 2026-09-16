# NovelForge Microservices Architecture

NovelForge is a modern digital novel and storytelling platform built with a distributed microservices architecture powered by Spring Boot (Java 21), Spring Cloud, PostgreSQL, Redis, and React (Vite).

---

## 🏛 Architecture & Port Overview

| Service | Technology | Port (Host) | Description |
|---|---|---|---|
| **`eureka-server`** | Spring Cloud Netflix Eureka | `8761` | Central Service Discovery & Registry |
| **`api-gateway`** | Spring Cloud Gateway (WebFlux) | `8080` | Unified Edge Router & Reverse Proxy |
| **`identity-service`** | Spring Boot / JPA / Redis / JWT | `8081` | Authentication, Authorization & User Management |
| **`notification-service`** | Spring Boot / JavaMail | `8082` | Email & Notifications (OTP delivery) |
| **`novel-service`** | Spring Boot / JPA / PostgreSQL | `8083` | Novel Metadata, Chapters & Content Management |
| **`engagement-service`** | Spring Boot / JPA | `8084` | User Engagement, Likes, Bookmarks & Comments |
| **`ai-service`** | Spring Boot | `8085` | AI-assisted writing & content generation |
| **`analytics-service`** | Spring Boot | `8086` | Reading analytics & telemetry |
| **`novelforge-client`** | React 19 + Vite + Nginx | `3000` (`:80`) | Frontend Web Application |
| **`postgres`** | PostgreSQL 16 Alpine | `5432` | Relational Databases (`userDB`, `novelDB`) |
| **`redis`** | Redis 7 Alpine | `6379` | Token caching & session management |

---

## 🐳 Docker Deployment Guide

### Prerequisites
- [Docker Engine & Docker Compose](https://www.docker.com/) installed.
- Java 21 & Node.js (if building JARs locally before containerization).

---

### Quick Start (Build & Run All Services)

#### Step 1: Build all service packages
Before spinning up the containers, package the shared security module and all microservices:

- **Windows**:
  ```cmd
  build-all.bat
  ```
- **Linux / macOS**:
  ```bash
  chmod +x build-all.sh
  ./build-all.sh
  ```

#### Step 2: Launch with Docker Compose
Start all databases, cache, service discovery, microservices, gateway, and frontend:

```bash
docker compose up -d --build
```

#### Step 3: Monitor Logs
```bash
# View logs from all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f api-gateway
docker compose logs -f identity-service
```

#### Step 4: Stop Services
```bash
docker compose down
```

---

## 🚀 Individual Service Docker Build

Each service contains its own optimized Dockerfile and `.dockerignore`. To build and run any individual service:

```bash
# 1. Package the service
cd <service-name>
./mvnw clean package -DskipTests

# 2. Build the Docker image
docker build -t novelforge/<service-name>:latest .

# 3. Run the container
docker run -p <PORT>:<PORT> novelforge/<service-name>:latest
```

For `novelforge-client` (Frontend):
```bash
cd novelforge-client
docker build -t novelforge/novelforge-client:latest .
docker run -p 3000:80 novelforge/novelforge-client:latest
```

---

## ☁️ Render Cloud Deployment

NovelForge includes a turnkey [Render Blueprint](file:///C:/Users/vivek/Desktop/novelforge-server/render.yaml) (`render.yaml`) for 1-click cloud deployment on [Render](https://render.com).

- **Blueprint File**: [`render.yaml`](file:///C:/Users/vivek/Desktop/novelforge-server/render.yaml)
- **Comprehensive Guide**: [`RENDER_DEPLOYMENT.md`](file:///C:/Users/vivek/Desktop/novelforge-server/RENDER_DEPLOYMENT.md)

### Highlights:
- **Free-Tier Optimized**: Configured with `-Xmx350m -Xms200m` JVM memory limits to run smoothly within 512MB RAM free-tier instances.
- **Dynamic Port & URL Binding**: Automatically maps Render's dynamic `$PORT` and transforms Render PostgreSQL URLs to Spring JDBC format.
- **Fully Automated**: Provisions managed PostgreSQL, Redis (Key Value), Eureka Server, API Gateway, all microservices, and Nginx frontend in a single step.

---

## 📡 API Routes via Gateway (`http://localhost:8080`)

| Route Pattern | Target Service |
|---|---|
| `/api/v1/identity/**` | `identity-service` |
| `/api/v1/novels/**` | `novel-service` |
| `/api/v1/notifications/**` | `notification-service` |
| `/` | `eureka-server` dashboard at `http://localhost:8761` |
| `http://localhost:3000` | Frontend Client (React) |

