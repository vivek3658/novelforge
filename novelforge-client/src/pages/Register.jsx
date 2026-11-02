import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';
import { Button, Input } from '../components/ui';
import Logo from '../assets/logo.png';

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRefs = useRef([]);
  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      await authApi.sendRegisterOtp(cleanEmail);
      setEmail(cleanEmail);
      success(`Verification code sent to ${cleanEmail}`);
      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      const msg = err.message || 'Failed to send verification code. Please try again.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP input changes
  const handleOtpChange = (index, value) => {
    // Handle paste of whole 6-digit code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (digits.length > 0) {
        const nextDigits = [...otpDigits];
        digits.forEach((d, i) => {
          if (i < 6) nextDigits[i] = d;
        });
        setOtpDigits(nextDigits);
        const nextFocus = Math.min(digits.length, 5);
        otpInputRefs.current[nextFocus]?.focus();
      }
      return;
    }

    const sanitized = value.replace(/\D/g, '');
    const nextDigits = [...otpDigits];
    nextDigits[index] = sanitized;
    setOtpDigits(nextDigits);

    if (sanitized && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      await authApi.verifyRegisterOtp(email, otp);
      success('Email successfully verified!');
      setStep(3);
    } catch (err) {
      const msg = err.message || 'Invalid or expired verification code.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Final Account Creation
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      await register({
        email,
        username: username.trim(),
        password,
      });
      success(`Welcome to NovelForge, ${username}!`);
      navigate('/profile', { replace: true });
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <img src={Logo} alt="NovelForge Logo" />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            {step === 1 && 'Enter your email to begin your NovelForge registration'}
            {step === 2 && `Enter the 6-digit code sent to ${email}`}
            {step === 3 && 'Choose your username and secure password'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator" aria-label="Registration steps">
          <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-circle">{step > 1 ? '✓' : '1'}</span>
            <span className="step-label">Email</span>
          </div>
          <div className={`step-line ${step > 1 ? 'completed' : ''}`} />
          <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-circle">{step > 2 ? '✓' : '2'}</span>
            <span className="step-label">Verify</span>
          </div>
          <div className={`step-line ${step > 2 ? 'completed' : ''}`} />
          <div className={`step-item ${step === 3 ? 'active' : ''}`}>
            <span className="step-circle">3</span>
            <span className="step-label">Profile</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span aria-hidden="true">⚠</span>
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Step 1: Email Form */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <Input
              id="register-email"
              label="Email Address"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              required
            />
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Send Verification Code →
            </Button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="otp-input-container">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpInputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="otp-box"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={loading}
                  aria-label={`Digit ${i + 1}`}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
              <button
                type="button"
                className="resend-btn"
                onClick={handleSendOtp}
                disabled={resendCooldown > 0 || loading}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={otpDigits.join('').length < 6}
              style={{ width: '100%' }}
            >
              Verify Code & Continue →
            </Button>
            <Button
              type="button"
              variant="quiet"
              onClick={() => setStep(1)}
              disabled={loading}
              style={{ width: '100%' }}
            >
              ← Change email
            </Button>
          </form>
        )}

        {/* Step 3: Profile Setup */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleCompleteRegistration}>
            <Input
              id="register-username"
              label="Username"
              type="text"
              placeholder="e.g. shadow_weaver"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={loading}
              maxLength={30}
              required
            />

            <div className="form-group">
              <label className="form-label" htmlFor="register-password">
                Password (min 8 characters)
              </label>
              <div className="input-wrapper">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input no-icon"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁' : '🔒'}
                </button>
              </div>
            </div>

            <Input
              id="register-confirm-password"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Complete Registration & Sign In
            </Button>
          </form>
        )}

        <div className="auth-card-footer">
          Already have a NovelForge account?
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
