import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../assets/logo.png';
import { authApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import './AuthPages.css';

const ForgotPassword = () => {
  // Step: 1 = Email, 2 = Verify OTP, 3 = Reset Password, 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputsRef = useRef([]);
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Resend OTP Countdown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send Password Reset OTP
  const handleSendResetOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      await authApi.forgotPasswordSendOtp(email.trim().toLowerCase());
      success(`If an account exists for ${email}, a reset code has been sent.`);
      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      const msg = err.message || 'Failed to send reset OTP. Please try again.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Input Handler
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
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

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify Reset OTP
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
      await authApi.forgotPasswordVerifyOtp(email.trim().toLowerCase(), otpCode);
      success('OTP verified. Please enter your new password.');
      setStep(3);
    } catch (err) {
      const msg = err.message || 'Invalid or expired OTP code.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      await authApi.forgotPasswordReset(email.trim().toLowerCase(), newPassword);
      success('Password reset successfully! Please sign in with your new password.');
      setStep(4);
    } catch (err) {
      const msg = err.message || 'Failed to reset password. Please try again.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <img src={Logo} alt="NovelForge Logo" />
          </div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Recover access to your NovelForge account</p>
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
              <span className="step-label">OTP</span>
            </div>
            <div className={`step-line ${step > 2 ? 'completed' : ''}`} />
            <div className={`step-item ${step === 3 ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <span className="step-label">New Password</span>
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
          <form className="auth-form" onSubmit={handleSendResetOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">
                Account Email
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
                  id="reset-email"
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
                  <span>Sending Reset Code...</span>
                </>
              ) : (
                'Send Password Reset OTP'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Verify Reset OTP */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="auth-alert auth-alert-info">
              <span>✉</span>
              <div>
                Verification code sent to <strong>{email}</strong>
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
                'Verify OTP'
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
                onClick={handleSendResetOtp}
                disabled={resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Set New Password */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">
                New Password
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
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-new-password">
                Confirm New Password
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
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter new password"
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
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm"></span>
                  <span>Updating Password...</span>
                </>
              ) : (
                'Save New Password'
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Success View */}
        {step === 4 && (
          <div className="success-view">
            <div className="success-icon-circle">✓</div>
            <h2 className="auth-title">Password Reset!</h2>
            <p className="auth-subtitle">
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>
            <button
              className="auth-btn-primary"
              onClick={() => navigate('/login')}
            >
              Back to Sign In
            </button>
          </div>
        )}

        <div className="auth-card-footer">
          Remember your password?
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
