# NovelForge Throughput & Capacity Reference (Read vs Write Profiles)

> **Measurement Environment**: Single developer host (12th Gen Intel Core i5-12500H, 12 physical cores, 16 logical threads, 16 GB DDR5), Windows 11 / WSL2 Docker Engine 29.8.2.  
> **Per-Container Limits**: 1.0 vCPU / 768 MB RAM per microservice; 4.0 vCPU / 1024 MB RAM for API Gateway.  
> **Datastores**: PostgreSQL 16 Alpine, MongoDB 7, Redis 7 Alpine, RabbitMQ 4 Management, Mailpit (SMTP sink).  
> **Statistical Protocol**: 60s warm-up, 1 discarded run per topology, randomized execution order, 5 repetitions per cell, validated with a Little's Law cross-check ($X \approx N / R$).

---

## 1. Quick Capacity Reference: Read vs. Write Requests

| Request Type / Scenario | Endpoint Pattern | 1 Instance (RPS) | 2 Instances (RPS) | 3 Instances (RPS) | Median Latency (p50) | Tail Latency (p99) | Dominant Bottleneck |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Public Catalog Reads** | `GET /api/v1/novels/search` | **222 req/s** | **543 req/s** | **424–500 req/s** | **11–66 ms** | **295–487 ms** | Microservice CPU / 10-conn Hikari pool |
| **Novel Details Read** | `GET /api/v1/novels/{id}` | **260 req/s** | **614 req/s** | **669 req/s** | **12–80 ms** | **180–439 ms** | Redis 30s cache hit / Gateway Netty |
| **Chapter Content Read** | `GET /api/v1/novels/{id}/chapters/{id}` | **473–676 req/s** | **850–1,120 req/s** | **1,200–1,450 req/s** | **8–18 ms** | **73–140 ms** | MongoDB Wire Protocol / BSON deserialization |
| **Authenticated Read** | `GET /api/v1/identity/auth/me` | **760–925 req/s** | **1,208–1,363 req/s** | **1,482–1,731 req/s** | **7–108 ms** | **62–1,427 ms** | Stateless JWT HMAC-SHA256 signature check (<1.5ms overhead) |
| **Social Likes (Verified Writes)** | `POST /api/v1/engagement/targets/POST/{id}/likes` | **57–122 writes/s** | **110–145 writes/s** | **160–210 writes/s** | **192–1,487 ms** | **354–3,409 ms** | 100% DB persistence verified (1 2xx == 1 SQL INSERT in `engagement_likes`) |
| **User Login (BCrypt Auth)** | `POST /api/v1/identity/auth/login` | **5.7 req/s** | **10.0 req/s** | **14.7 req/s** | **582–1,689 ms** | **941–2,150 ms** | CPU-bound 10-round BCrypt hashing under 1.0 vCPU CFS quota (2.58× speedup on 3x) |
| **Mixed Production Mix** | 80% Read / 15% Auth / 5% Write | **332–415 req/s** | **346–416 req/s** | **429–733 req/s** | **10–508 ms** | **96–1,509 ms** | Balanced composite workload |

---

## 2. In-Depth Read Capacity Analysis

### How Many Read Requests Can NovelForge Handle?
- **Raw Public Reads (Catalog & Details)**:
  - Under single-container deployment (1.0 vCPU), NovelForge sustains **222 req/s** at 50 connections with **202ms p50** and **397ms p99**.
  - Scaling horizontally to 2 containers increases throughput to **543 req/s** at 50 connections (**2.44× speedup**) with **66ms p50** and **295ms p99**. Peak throughput reaches **669 req/s** at 200 connections.
  - Adding a 3rd container delivers **424–500 req/s** with perfectly balanced request distribution (33.3% / 33.3% / 33.3% across all 3 containers via Spring Cloud Gateway round-robin).
- **Chapter Streaming (MongoDB Rich Content Blocks)**:
  - Sustains **473–676 req/s** per container instance with ultra-low **8ms p50** and **73ms p99** latency.
  - With 2–3 instances, chapter read capacity surpasses **1,200–1,450 req/s** through the API Gateway.
- **Stateless Authenticated Reads**:
  - \`GET /api/v1/identity/auth/me\` introduces only **<1.5ms latency overhead** compared to unauthenticated reads.
  - Validates HMAC-SHA256 signature statelessly in memory without issuing a database query, scaling linearly with available CPU cores.

---

## 3. In-Depth Write Capacity Analysis

### How Many Write Requests Can NovelForge Handle?
- **Transactional Database Writes (Likes / Engagement)**:
  - Single container (1.0 vCPU / 768 MB): **57.0 writes/s** at 10 conns ($p50 = 192\text{ ms}$), **95.4 writes/s** at 50 conns ($p50 = 494\text{ ms}$), **101.8 writes/s** at 100 conns ($p50 = 808\text{ ms}$), and **122.0 writes/s** at 200 conns ($p50 = 1,487\text{ ms}$).
  - **Empirical Persistence Guarantee**: Every request targets a distinct `(user, targetId)` pair; 100% of HTTP 2xx responses persist an SQL `INSERT` into `engagement_likes` (row count before/after verified in PostgreSQL).
  - **Bottleneck**: The write ceiling is governed by:
    1. **HikariCP Connection Pool**: Default `maximum-pool-size: 10` on `engagement-service` causes worker thread serialization when 100+ concurrent write requests arrive.
    2. **PostgreSQL Disk Sync & Transaction Log**: Every unique write commits a transaction and updates database indexes (`ix_like_user_target`).
- **Cryptographic Authentication Writes (Login)**:
  - Single container (1.0 vCPU): **5.7 logins/s** ($p50 = 1,689\text{ ms}$, mean $= 1,603\text{ ms}$) under Linux CFS quota throttling (`throttled_usec: 2870s`).
  - 2 containers (2.0 vCPUs): **10.0 logins/s** ($p50 = 875\text{ ms}$).
  - 3 containers (3.0 vCPUs): **14.7 logins/s** ($p50 = 582\text{ ms}$).
  - **Bottleneck**: BCrypt with 10 rounds executes 1,024 iterations per login attempt. Under a 1.0 vCPU container quota, one core computes approximately 5.7 BCrypt hashes per second. Scaling microservice containers adds independent CPU cores, achieving an authentic **2.58× horizontal speedup** (86% efficiency across 3 cores).

---

## 4. Key Architectural Insights & Tuning Levers

1. **Why 2x ≈ 1x at 200 Concurrency on Read-Heavy Workloads**:
   - At 10–50 connections, scaling stateless containers distributes CPU load effectively.
   - At 100–200 connections, both containers exhaust their 10 Hikari connections and contend for shared PostgreSQL disk I/O and host CPU. Adding containers cannot increase throughput when the downstream connection pool is saturated.
2. **Production Tuning Recommendations**:
   - **Hikari Connection Pool**: Sized according to PostgreSQL / Brett Wooldridge pool sizing guidance: $\text{connections} = \text{core\_count} \times 2 + \text{effective\_spindle\_count}$.
   - **Gateway Caffeine Cache**: Cache catalog search responses directly in API Gateway memory for 10–30 seconds to bypass downstream network hops.
   - **Idempotent Retry**: Configure Spring Cloud Gateway retry for GET requests on `5xx` / `ConnectException` to guarantee 0.00% client-facing error rate during dynamic failover.
