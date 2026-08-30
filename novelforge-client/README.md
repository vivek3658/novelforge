# NovelForge Client

A modern, fully responsive React web application for NovelForge built with Vite, React 19, and React Router 7. Features complete Identity Service integration with cookie-based refresh tokens, multi-step OTP verification, and dual theme support (Minimal White & Black Dark Mode).

## 🌟 Key Features

- **Minimal White & Deep Black (Dark Mode) Themes**:
  - Maintained the clean minimal white aesthetic while adding a deep obsidian dark mode.
  - Interactive theme switcher in the Navbar with localStorage persistence.
- **Full Responsive Design**:
  - Optimized for mobile, tablet, and desktop screens.
  - Animated mobile navigation drawer with touch-friendly controls.
- **Authentication & Identity Service Integration**:
  - **Login (`/login`)**: Identifier (Username or Email) and Password login with JWT access token handling.
  - **Register (`/register`)**: 3-step registration flow:
    1. Send Email OTP (`POST /api/v1/identity/register/send-otp`)
    2. Verify 6-Digit OTP (`POST /api/v1/identity/register/verify-otp`)
    3. Create Username & Password (`POST /api/v1/identity/register`)
  - **Forgot Password (`/forgot-password`)**:
    1. Request Reset OTP (`POST /api/v1/identity/auth/forgot-password`)
    2. Verify OTP (`POST /api/v1/identity/auth/forgot-password/verify`)
    3. Reset to New Password (`POST /api/v1/identity/auth/forgot-password/reset`)
  - **Current User Profile (`/profile` / `/me`)**:
    - Fetches live profile details from `GET /api/v1/identity/auth/me`.
    - Live **HttpOnly Cookie Refresh Token Tester** (`POST /api/v1/identity/auth/refresh`).
    - API Base URL switcher (supports API Gateway `http://localhost:8080/api/v1/identity` and direct Identity Service `http://localhost:8081/api/v1/identity`).
- **Global Toast Notification System**: Real-time feedback for all user actions.
- **Protected & Guest Routes**: Automatic routing and session persistence.

## 🚀 Running the App

```bash
cd novelforge-client
npm run dev
```

The app will run on `http://localhost:5173`.
