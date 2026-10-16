import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Route-level lazy loading for performance and bundle splitting
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const Trending = lazy(() => import('./pages/Trending'));
const Novels = lazy(() => import('./pages/Novels'));
const NovelDetail = lazy(() => import('./pages/NovelDetail'));
const Reader = lazy(() => import('./pages/Reader'));
const Categories = lazy(() => import('./pages/Categories'));
const Community = lazy(() => import('./pages/Community'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Accessible, responsive loading skeleton for route transitions
const PageLoader = () => (
  <div className="loading-screen" role="status" aria-live="polite">
    <div className="spinner" />
    <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>Loading NovelForge...</span>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const isReaderView = location.pathname.startsWith('/read/');

  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      {/* Hide default Navbar during immersive reading mode */}
      {!isReaderView && <Navbar />}

      <main className="main-content" id="main-content" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Discovery Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/novels" element={<Novels />} />
            <Route path="/novels/:id" element={<NovelDetail />} />
            <Route path="/read/:novelId/:chapterId" element={<Reader />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/community" element={<Community />} />

            {/* Authentication Pages (Only accessible to unauthenticated guests) */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPassword />
                </PublicOnlyRoute>
              }
            />

            {/* Protected Account & Profile Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/me"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* 404 Not Found Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {/* Hide standard Footer during immersive reading mode */}
      {!isReaderView && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;