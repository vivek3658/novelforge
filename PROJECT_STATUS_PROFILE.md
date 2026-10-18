# NovelForge — Full Project Status, Architecture & Profile Optimization Guide

> **Prepared for Profile & Resume Optimization with Claude / LLMs**  
> **Repository:** `novelforge-server`  
> **Current Active Branch:** `feature/creator-service` (working tree cleanly restored)  
> **Base / Production Branch:** `main` (fully synced with `origin/main`)  
> **Date:** October 2026  

---

## 📌 Executive Summary

**NovelForge** is a production-grade, distributed microservices platform for digital novels, web fiction, and collaborative storytelling. Built with **Spring Boot 3 (Java 21)**, **Spring Cloud**, **PostgreSQL**, **Redis**, and a modern **React 19 / Vite** single-page frontend, NovelForge demonstrates enterprise-level distributed systems engineering, reactive edge routing, cloud cost optimization, and automated lifecycle workflows.

---

## 🏛 Overall System Architecture

NovelForge adopts a decentralized microservices architecture deployed to cloud infrastructure (Render + Docker) with Infrastructure-as-Code (IaC):

```
                        +----------------------------+
                        |  novelforge-client (React) |
                        |     (Vite + Nginx :3000)   |
                        +--------------+-------------+
                                       |
                                       v
                        +----------------------------+
                        |   api-gateway (WebFlux)    | <--- Edge Router & Reverse Proxy (:8080)
                        +--------------+-------------+
                                       |
      +-------------------+------------+------------+--------------------+
      |                   |                         |                    |
      v                   v                         v                    v
+--------------+   +--------------+          +--------------+     +--------------+
|   identity   |   |    novel     |          | notification |     |    studio    |
|   service    |   |   service    |          |   service    |     |   service    |
|    (:8081)   |   |   (:8083)    |          |   (:8082)    |     |  (In-Flight) |
+-------+------+   +-------+------+          +-------+------+     +--------------+
        |                  |                         |
        v                  v                         |
 +--------------+   +--------------+                 |
 | PostgreSQL   |   | PostgreSQL   |                 |
 |  (userDB)    |   |  (novelDB)   |                 |
 +--------------+   +--------------+                 |
        |                                            |
        v                                            v
 +--------------+                            +--------------+
 | Redis Cache  |                            | JavaMail SMTP|
 | (Sessions)   |                            +--------------+
 +--------------+

   [eureka-server: Service Discovery (:8761)]
   [Shared Libraries: novelforge-common | novelforge-security]
```

---

## 📊 Where You Currently Stand (Progress Breakdown)

| Component / Microservice | Status | Completion % | Key Capabilities & Highlights |
|---|---|:---:|---|
| **`novelforge-security`** | **Production Ready** | 100% | Reusable security starter, stateless `JwtAuthFilter`, HMAC-SHA256 signature verification, claims extraction, dynamic role extraction. |
| **`novelforge-common`** | **Production Ready** | 100% | Shared `BaseEntity` (audit timestamps, IDs), standardized global error structures (`ErrorDetails`), custom HTTP exception hierarchy. |
| **`eureka-server`** | **Production Ready** | 100% | Spring Cloud Netflix Eureka registry, peer discovery, dynamic registration. |
| **`api-gateway`** | **Production Ready** | 100% | Spring Cloud Gateway (WebFlux reactive engine), path rewriting, CORS management, production direct HTTPS routing bypass for cloud hosting. |
| **`notification-service`** | **Production Ready** | 100% | JavaMail email engine, OTP email dispatch, SMTP socket connection & read timeout resilience, decoupled actuator healthchecks. |
| **`identity-service`** | **Core Complete / Expanding** | 90% | Multi-step registration, Redis registration state caching, OTP validation via WebClient, JWT issuance, password reset workflow, role permissions matrix. |
| **`novel-service`** | **Core Complete** | 90% | Novel metadata, chapter management, polymorphic content blocks (`TextBlock`, `IllustrationBlock`), soft-delete with 30-day retention & `@Scheduled` purge. |
| **`novelforge-client`** | **Production Ready** | 85% | React 19 + Vite + Tailwind, centralized Axios client, Auth Context, Catalog, Reader, Profile, Login/Register pages, Nginx Alpine container. |
| **`feature/creator-service`** | **In-Progress (Active Branch)** | 70% | Creator role lifecycle (`CreatorService`, activation/deactivation), account soft deletion & restore (`AccountService`), 30-day account cleanup scheduler, unit tests. |
| **`studio-service`** | **Scaffolded** | 25% | Dedicated microservice initialized (`pom.xml`, Spring Boot entrypoint, Maven wrapper) for creator authoring & studio management. |
| **`engagement-service`** | **Scaffolded** | 15% | Scaffolded for comments, bookmarks, ratings, and reader interactions. |
| **`ai-service`** | **Scaffolded** | 10% | Scaffolded for AI-assisted writing, automated synopsis generation, and tagging. |
| **`analytics-service`** | **Scaffolded** | 10% | Scaffolded for telemetry, reading time analytics, and view tracking. |
| **Cloud DevOps & IaC** | **Production Ready** | 100% | Multi-stage Dockerfiles, Docker Compose, Render Blueprint (`render.yaml`), JVM free-tier memory tuning (`-Xmx350m -Xms200m`). |

---

## 🛠 Active Work on Current Branch (`feature/creator-service`)

Your working tree on `feature/creator-service` contains the following newly developed features:

1. **Creator Lifecycle Management (`CreatorService`, `ProfileController`)**:
   - State transition: `CreatorStatus` (`NONE`, `ACTIVE`, `DEACTIVATED`, `SUSPENDED`).
   - Secure activation & deactivation endpoints (`POST /api/v1/profile/creator`, `POST /api/v1/profile/creator/deactivate`).
   - Business rule enforcement: prevents suspended creators from reactivating themselves.

2. **User Account Soft Deletion & Self-Service Restoration (`AccountService`, `AccountController`)**:
   - `DELETE /api/v1/account`: Puts user account into `PENDING_DELETION` status and sets `deletedAt = Instant.now()`.
   - `POST /api/v1/account/restore`: Allows users to cancel scheduled deletion and restores status to `ACTIVE`.
   - Automated background scheduler (`AccountCleanupScheduler` with `@Scheduled`) that permanently purges or soft-deletes records after 30 days.
   - Comprehensive unit test suite (`AccountServiceTest` with 245 lines of test cases covering all edge conditions).

3. **Creator Studio Microservice Scaffolding (`studio-service`)**:
   - Created standalone Maven project structure with Spring Boot 3 dependencies, Spring Cloud discovery, and test infrastructure.

---

## 💡 Key Engineering Challenges & Accomplishments (Resume Gold)

When optimizing your profile or discussing this project in interviews, highlight these concrete technical accomplishments:

1. **Decoupled Cross-Service Communication via WebClient & Redis**:
   - Avoided heavy blocking REST calls; used non-blocking WebClient from `identity-service` to `notification-service` for asynchronous OTP delivery.
   - Leveraged Redis with TTLs for transient registration states and password reset tokens, preventing database pollution from incomplete signups.

2. **Polymorphic Domain Modeling for Novel Content**:
   - Modeled chapter contents in `novel-service` using a polymorphic block architecture (`ChapterBlock`, `TextBlock`, `IllustrationBlock`), enabling flexible rich-text web fiction formats and future AI-generated illustrations.

3. **Two-Tier Safe Deletion Architecture (Soft-Delete + Cron Purge)**:
   - Designed a 30-day grace period for both novels and user accounts to prevent accidental data loss and support regulatory compliance (GDPR right to erasure / cooling off).
   - Engineered automated Spring `@Scheduled` background cleanup services to reliably sweep expired entities.

4. **Production Cloud Optimization for Low-Memory Environments**:
   - Deployed 6+ microservices on cloud free-tier containers (Render 512MB RAM).
   - Engineered custom JVM options (`JAVA_OPTS="-Xmx350m -Xms200m -XX:+UseG1GC"`) and multi-stage Alpine Docker builds (~200MB images) to completely eliminate `OOMKilled` container termination.
   - Solved dynamic port binding and cloud URL rewrites in Spring Cloud Gateway to seamlessly route traffic over public HTTPS without internal port conflicts.

---

## 🤖 Ready-to-Use Prompt for Claude to Optimize Your Profile

Copy and paste the block below into Claude to generate high-impact resume bullet points, a LinkedIn experience summary, or a GitHub portfolio profile:

```markdown
Hi Claude! Please help me optimize my software engineering profile (Resume bullet points, LinkedIn project description, and GitHub portfolio summary) based on my project "NovelForge".

Here are the exact details of the project:
---
PROJECT NAME: NovelForge
ROLE: Full-Stack / Backend Microservices Engineer
TECH STACK:
- Backend: Java 21, Spring Boot 3.x, Spring Cloud (Gateway, Netflix Eureka), Spring Security 6, Spring Data JPA, Hibernate, JavaMail
- Frontend: React 19, Vite, Tailwind CSS, Axios, Context API, Nginx
- Data & Caching: PostgreSQL 16, Redis 7 (TTL caching, registration state, password reset tokens)
- Architecture: Microservices, RESTful APIs, Polymorphic Data Modeling, Edge Routing, Stateless JWT Auth
- DevOps & Cloud: Docker, Multi-Stage Builds, Docker Compose, Render Cloud Platform, Infrastructure-as-Code (YAML Blueprint), Git / GitHub Actions

KEY ARCHITECTURAL HIGHLIGHTS & ACHIEVEMENTS:
1. Microservices Ecosystem:
   - Identity Service: Multi-step registration with Redis TTL caching, WebClient OTP verification, JWT authentication, role-based authorization matrix (USER, AUTHOR, ADMIN).
   - Novel Service: Full novel lifecycle with polymorphic chapter content blocks (TextBlock, IllustrationBlock), soft-deletion pattern with 30-day recovery grace period and @Scheduled background cron purge.
   - Notification Service: Decoupled email/OTP delivery service with JavaMailSender and resilient SMTP connection/read timeout handling.
   - API Gateway: Reactive Spring Cloud Gateway (WebFlux) providing reverse proxy, route path rewriting, and CORS policy enforcement.
   - Eureka Discovery: Service registry enabling dynamic service discovery.
   - Studio Service (in-progress): Specialized creator dashboard and authoring studio microservice.
2. Production Cloud Engineering:
   - Optimized JVM containers (-Xmx350m -Xms200m) running across multiple microservices on 512MB RAM constraints on Render, avoiding OOM errors.
   - Automated deployment via Docker multi-stage Alpine builds and Render IaC blueprints.
   - High-performance frontend delivery using Nginx reverse proxy with Gzip compression and SPA HTML5 history routing.
3. Recent In-Flight Work:
   - Built Creator status transition engine (NONE -> ACTIVE -> DEACTIVATED -> SUSPENDED) with privilege validation.
   - Implemented self-service account deletion and 30-day restoration window with automated background cleanup scheduler and unit tests.

PLEASE GENERATE:
1. 4-5 high-impact, STAR/XYZ-format resume bullet points tailored for Senior/Mid-level Java Backend / Full-Stack roles (focus on metrics, architecture, scalability, and resilience).
2. A compelling LinkedIn Experience / Project section.
3. A concise, catchy GitHub README project highlight summary.
4. Top 3 System Design interview talking points that demonstrate deep technical maturity.
```

---
*Generated automatically by NovelForge Assistant — Codebase verified and stashed state cleanly restored on `feature/creator-service`.*
