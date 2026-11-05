# NovelForge: Verified Status and Portfolio Assessment

Last reviewed: 2026-11-05. This assessment is based on the checked-in source, Docker/Render configuration, API contracts, and local benchmark reports. It does not imply a live production deployment.

## Project summary

NovelForge is a serialized-fiction platform with a React/Vite client and separately deployable Spring Boot services for Identity, Novels, Studios, Engagement, and OTP email delivery. Spring Cloud Gateway fronts browser APIs; Eureka is used for discovery in the performance topology. PostgreSQL hosts service-specific databases, MongoDB stores chapter documents, Redis supports cache/short-lived state/rate limiting, and RabbitMQ carries asynchronous OTP and feed events.

Admin and moderation features are implemented as Identity APIs. There are no separate Admin or Moderation services in the runtime. The notification service is an OTP email consumer, not a general in-app notification platform. The client Inbox for collaboration invitations is backed by Studio membership records.

## Evidence-backed strengths

- A vertical product slice exists across authentication, novel discovery/reading, studio authoring, community engagement, and studio collaboration.
- Novel content uses relational metadata plus MongoDB chapter documents and ordered content blocks.
- Studio authorization is permission-scoped; invitations are persisted and accepted by the addressed user.
- The API Gateway has explicit route rewrites and rate limits for OTP endpoints. RabbitMQ decouples OTP delivery and feed fanout.
- Docker Compose provides a local multi-service environment; a separate performance override enables Eureka `lb://` routing and replicas for selected tests.
- The performance reports document controlled local tests, including verified persisted social writes, 1-3 instance runs, and a Little's Law cross-check. The capacity profile records both scaling gains and non-linear results/bottlenecks.

## Scalability: what can be claimed

The checked-in measurements are local Docker Desktop results, not a production service-level objective or a maximum user count. Test cases include public reads in the hundreds of requests per second, chapter reads over 1,000 requests per second in selected 3-instance runs, verified social writes around 57-122 writes per second for one instance under tested concurrency, and login throughput rising from 5.7 to 14.7 requests per second from one to three instances under the stated CPU limits.

Default `docker-compose.yml` runs a single instance of each service and uses direct service URLs. Horizontal measurements rely on `docker-compose.perf.yml`. Capacity is bounded by the gateway, per-service CPU/memory, database connection pools, shared data stores, workload shape, and the benchmark host. Do not extrapolate the numbers linearly or present them as cloud production capacity.

## Honest assessment

As a portfolio project: **7/10**. It is technically substantial and gives strong system-design interview material, especially around service boundaries, persistence choices, asynchronous messaging, authorization, Docker, and measured performance.

As a production system by Big Tech standards: **4/10 based on the evidence available here**. Production readiness requires more than a multi-service diagram and load results: verified end-to-end flows, operational ownership, reliable migrations/rollback, security review and secret rotation, observability/alerting, failure-mode testing, and deployment evidence. The checked-in benchmark is useful engineering evidence, but it does not prove those operational properties.

The best framing is “a multi-service portfolio platform with measured local performance experiments,” not “production-grade” or “Big Tech scale.”

## Next improvements

1. Add browser-level smoke tests for novel metadata updates, chapter selection/creation, and invitation acceptance.
2. Rotate any credentials that may have been exposed in repository history; keep deployment secrets out of YAML and source control.
3. Add repeatable CI gates for backend tests, client lint/build, and API contract checks.
4. Capture deployment-specific load, latency, error-rate, and resource evidence before publishing a cloud capacity claim.
5. Document service recovery, schema migration, backup/restore, and alerting procedures before calling the platform production-ready.
