# NovelForge API

## Services

| Service | Base URL | Base Path |
|---|---|---|
| API Gateway | `http://localhost:8080` | `/` |
| Eureka Server | `http://localhost:8761` | `/eureka` |
| Identity Service | `http://localhost:8081` | `/api/v1/identity` |
| Notification Service | `http://localhost:8082` | `/api/v1/notification` |

---

## Eureka

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Eureka Dashboard |
| GET | `/eureka/apps` | Registered services |
| GET | `/eureka/apps/{service}` | Service instances |

---

## Notification Service

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/notification/email` | Send Email OTP |

---

## Identity Service

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/identity/register/send-otp` | Send Registration OTP |
| POST | `/api/v1/identity/register/verify-otp` | Verify Registration OTP |
| POST | `/api/v1/identity/register` | Register User |
| POST | `/api/v1/identity/auth/login` | Login |
| POST | `/api/v1/identity/auth/refresh` | Refresh Access Token |
| POST | `/api/v1/identity/auth/logout` | Logout |
| GET | `/api/v1/identity/auth/me` | Get Current User |
| POST | `/api/v1/identity/auth/forgot-password` | Send Password Reset OTP |
| POST | `/api/v1/identity/auth/forgot-password/verify` | Verify Password Reset OTP |
| POST | `/api/v1/identity/auth/forgot-password/reset` | Reset Password |