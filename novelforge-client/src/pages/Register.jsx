import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../assets/logo.png';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './AuthPages.css';

const Register = () => {
  // Step: 1 = Email, 2 = Verify OTP, 3 = Account Details, 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputsRef = useRef([]);
  const { register } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // Resend OTP Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      await authApi.sendRegisterOtp(email.trim().toLowerCase());
      success(`Verification code sent to ${email}`);
      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      const msg = err.message || 'Failed to send OTP. Please try again.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Input Handler
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of full 6-digit OTP
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newOtp = [...otpValues];
        for (let i = 0; i < 6; i++) {
          newOtp[i] = pasted[i] || '';
        }
        setOtpValues(newOtp);
        const focusIndex = Math.min(pasted.length, 5);
        otpInputsRef.current[focusIndex]?.focus();
      }
      return;
    }

    const val = value.replace(/\D/g, '');
    const newOtp = [...otpValues];
    newOtp[index] = val;
    setOtpValues(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otpValues.join('');
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      await authApi.verifyRegisterOtp(email.trim().toLowerCase(), otpCode);
      success('Email successfully verified! Create your username and password.');
      setStep(3);
    } catch (err) {
      const msg = err.message || 'Invalid or expired OTP. Please try again.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, text: '', color: '' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, text: 'Weak', color: '#ef4444' };
      case 2:
        return { score: 50, text: 'Fair', color: '#f59e0b' };
      case 3:
        return { score: 75, text: 'Good', color: '#3b82f6' };
      case 4:
        return { score: 100, text: 'Strong', color: '#10b981' };
      default:
        return { score: 15, text: 'Too short', color: '#ef4444' };
    }
  };

  // Step 3: Complete Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
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
    setIsLoading(true);

    try {
      await register({
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password: password,
        profileImageName: null,
      });
      success(`Welcome to NovelForge, ${username}!`);
      setStep(4);
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <img src={Logo} alt="NovelForge Logo" />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the NovelForge universe of writers & readers</p>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="step-indicator">
            <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
              <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
              <span className="step-label">Email</span>
            </div>
            <div className={`step-line ${step > 1 ? 'completed' : ''}`} />
            <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
              <div className="step-circle">{step > 2 ? '✓' : '2'}</div>
              <span className="step-label">Verify</span>
            </div>
            <div className={`step-line ${step > 2 ? 'completed' : ''}`} />
            <div className={`step-item ${step === 3 ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <span className="step-label">Profile</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="auth-alert auth-alert-error">
            <span>⚠</span>
            <div>{errorMessage}</div>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="register-email">
                Email Address
              </label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="register-email"
                  type="email"
                  className="form-input"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm"></span>
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                'Send Verification OTP'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="auth-alert auth-alert-info">
              <span>✉</span>
              <div>
                We sent a 6-digit verification code to <strong>{email}</strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Enter 6-Digit OTP</label>
              <div className="otp-input-container">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-box"
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={isLoading || otpValues.join('').length !== 6}
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm"></span>
                  <span>Verifying Code...</span>
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.88rem' }}>
              <button
                type="button"
                className="resend-btn"
                onClick={() => setStep(1)}
              >
                Change Email
              </button>
              <button
                type="button"
                className="resend-btn"
                onClick={handleSendOtp}
                disabled={resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Create Username and Password */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleCompleteRegistration}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Choose Username
              </label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  placeholder="e.g. ShadowWriter"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password
              </label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {password && (
                <div className="password-strength">
                  <div className="strength-bar-bg">
                    <div
                      className="strength-bar-fill"
                      style={{
                        width: `${strength.score}%`,
                        backgroundColor: strength.color,
                      }}
                    />
                  </div>
                  <span className="strength-text">
                    Password strength: <strong>{strength.text}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">
                Confirm Password
              </label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={isLoading || !username || !password || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Success View */}
        {step === 4 && (
          <div className="success-view">
            <div className="success-icon-circle">✓</div>
            <h2 className="auth-title">Account Created!</h2>
            <p className="auth-subtitle">
              Your account has been registered and verified successfully.
            </p>
            <button
              className="auth-btn-primary"
              onClick={() => navigate('/profile')}
            >
              Go to Profile
            </button>
          </div>
        )}

        <div className="auth-card-footer">
          Already have an account?
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
