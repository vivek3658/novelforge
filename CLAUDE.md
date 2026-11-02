# NovelForge — Claude Context & Technical Reference

> For comprehensive performance data, architectural mechanics, and interview talking points, see [docs/CLAUDE_CONTEXT.md](file:///C:/Users/vivek/Desktop/novelforge-server/docs/CLAUDE_CONTEXT.md).

## Quick Architecture Map
- **Edge Gateway**: Spring Cloud Gateway Netty WebFlux (`:8080`)
- **Service Registry**: Netflix Eureka Server (`:8761`)
- **Identity Service**: Spring Boot / JWT / 10-Round BCrypt (`:8081`)
- **Novel Service**: Spring Boot / JPA (`novelDB`) / Spring Data MongoDB (`novelforge_chapters`) (`:8083`)
- **Engagement Service**: Spring Boot / JPA (`engagementDB`) (`:8084`) — Likes & Social Engagement
- **Notification Service**: Spring Boot / AMQP / Mailpit (`:1025`, web `:8025`)
- **Studio Service**: Spring Boot Author Publishing Studio (`:8087`)
- **Databases**: PostgreSQL (`:5433`), MongoDB (`:27018`), Redis (`:6379`), RabbitMQ (`:5672`, mgmt `:15672`)
- **Frontend**: React 19 + Vite (`:3000`)

## Performance Benchmark Summary
- **Validated with a Little's Law Cross-Check ($X \approx N / R$)**: Every stable concurrency cell matches theoretical throughput within **< 3.5% variance**.
- **Write Path (Verified Persistent Social Likes)**: Tested with dynamically unique `(user, targetId)` pairs per request, verifying 100% database persistence (1 HTTP 2xx == 1 SQL `INSERT` in `engagement_likes`). Throughput scaled from **57.0 writes/s** at 10 conns ($p50 = 192\text{ ms}$) to **122.0 writes/s** at 200 conns ($p50 = 1,487\text{ ms}$) with zero socket errors or timeouts.
- **Public Reads**: Reaches **669 req/s** at 200 connections; 2.44x speedup at 50 connections.
- **Chapter Reads (MongoDB)**: Peaked at **1,121.7 req/s** with sub-17ms $p50$.
- **Stateless Auth JWT Reads**: Peaked at **1,904.7 req/s** with $< 1.5\text{ ms}$ overhead over unauthenticated reads.
- **CPU-Bound BCrypt Auth**: Steady-state throughput on 1x container (1.0 vCPU) is **5.7 req/s** ($p50 = 1,689\text{ ms}$) under Linux CFS quota throttling (`cpu.stat throttled_usec: 2870s`). Scaling to 3 instances reaches **14.7 req/s** (**2.58× horizontal speedup**, 86% efficiency on 3 cores; $p50$ dropped to 582ms).
- **Chaos Failover**: Reduced MTTR by **83.8% (34.0s $\rightarrow$ 5.5s)** and dropped client error rate to **0.00%** via tuned Eureka 5s registry refresh + 5s load balancer cache TTL + idempotent GET retries.
- **External Safety**: Mailpit intercepted exactly **1 probe email**, `BREVO_API_KEY=disabled-perf-no-brevo` confirmed absent.

## Useful Commands
```bash
# Start infrastructure
docker compose up -d

# Run performance smoke tests
node perf/smoke-test.mjs

# Run full performance benchmark pipeline
node perf/run-pipeline.mjs

# Regenerate publication report from latest results
node perf/report/generate.mjs
```
