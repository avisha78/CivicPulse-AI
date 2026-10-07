
import React, { useState } from "react";

import axios from "axios";

import {
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";

import {
  FaLock,
  FaEnvelope,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
} from "react-icons/fa";

import { useAppSettings } from "../components/AppSettingsContext";

function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useAppSettings();

  // =====================================================
  // DETERMINE WHICH LOGIN PAGE USER CAME FROM
  // =====================================================

  const from = location.state?.from || "citizen";

  const loginPath =
    from === "officer"
      ? "/officer-login"
      : from === "admin"
      ? "/admin-login"
      : "/citizen-login";

  const loginText =
    from === "officer"
      ? t("backToOfficerLogin")
      : from === "admin"
      ? t("backToAdminLogin")
      : t("backToCitizenLogin");

  // =====================================================
  // STATES
  // =====================================================

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // SEND OTP
  // =====================================================

  const handleSendOTP = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = t("emailRequired");
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      newErrors.email = t("validEmail");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      setMessage("");

      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        {
          email: email.trim().toLowerCase(),
        }
      );

      setMessage(
        response.data?.message ||
          t("forgotPasswordOTPSent")
      );

      setStep(2);
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      setErrors({
        server:
          error.response?.data?.message ||
          t("unableToSendOTP"),
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      setErrors({
        otp: t("pleaseEnterOTP"),
      });
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setErrors({
        otp: t("otpExactlySixDigits"),
      });
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      setMessage("");

      const response = await axios.post(
        "http://localhost:5000/api/auth/verify-forgot-password-otp",
        {
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }
      );

      setMessage(
        response.data?.message ||
          t("otpVerifiedSuccessfully")
      );

      setStep(3);
    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      setErrors({
        otp:
          error.response?.data?.message ||
          t("invalidExpiredOTP"),
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword =
        t("newPasswordRequired");
    } else {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$#!%*?&]).{8,}$/;

      if (!passwordRegex.test(newPassword)) {
        newErrors.newPassword =
          t("passwordRequirements");
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        t("confirmPasswordRequired");
    } else if (
      confirmPassword !== newPassword
    ) {
      newErrors.confirmPassword =
        t("passwordMismatch");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      setMessage("");

      const response = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        {
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }
      );

      setMessage(
        response.data?.message ||
          t("passwordResetSuccessful")
      );

      // ==========================================
      // REDIRECT TO THE LOGIN PAGE USER CAME FROM
      // ==========================================

      setTimeout(() => {
        navigate(loginPath);
      }, 1500);
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      setErrors({
        server:
          error.response?.data?.message ||
          t("unableToResetPassword"),
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="cp-auth-page">
      <div className="cp-auth-card">

        {/* =================================================
            ICON
        ================================================= */}

        <div className="cp-auth-logo">
          {step === 1 && <FaEnvelope />}
          {step === 2 && <FaKey />}
          {step === 3 && <FaLock />}
        </div>

        {/* =================================================
            HEADER
        ================================================= */}

        <h1>
          {step === 1 && t("forgotPassword")}
          {step === 2 && t("verifyOTP")}
          {step === 3 && t("createNewPassword")}
        </h1>

        <p className="cp-auth-subtitle">
          {step === 1 &&
            t("forgotPasswordDescription")}

          {step === 2 &&
            t("forgotPasswordOTPDescription").replace(
              "{email}",
              email
            )}

          {step === 3 &&
            t("createNewPasswordDescription")}
        </p>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {message && (
          <div className="cp-success-message">
            {message}
          </div>
        )}

        {/* =================================================
            SERVER ERROR
        ================================================= */}

        {errors.server && (
          <div className="cp-error-box">
            {errors.server}
          </div>
        )}

        {/* =================================================
            STEP 1 - EMAIL
        ================================================= */}

        {step === 1 && (
          <form onSubmit={handleSendOTP}>

            <div className="cp-form-group">

              <label htmlFor="email">
                <FaEnvelope />
                {t("emailAddress")}
              </label>

              <input
                id="email"
                type="email"
                placeholder={t(
                  "registeredEmailPlaceholder"
                )}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({});
                  setMessage("");
                }}
                className={
                  errors.email
                    ? "cp-input cp-input-error"
                    : "cp-input"
                }
              />

              {errors.email && (
                <div className="cp-form-error">
                  {errors.email}
                </div>
              )}

            </div>

            <button
              type="submit"
              className="cp-auth-submit"
              disabled={loading}
            >
              <FaKey />

              <span>
                {loading
                  ? t("sendingOTP")
                  : t("sendOTP")}
              </span>
            </button>

          </form>
        )}

        {/* =================================================
            STEP 2 - OTP
        ================================================= */}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>

            <div className="cp-form-group">

              <label htmlFor="otp">
                <FaKey />
                {t("enterOTP")}
              </label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder={t(
                  "otpPlaceholder"
                )}
                value={otp}
                onChange={(e) => {
                  const value =
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6);

                  setOtp(value);
                  setErrors({});
                  setMessage("");
                }}
                className={
                  errors.otp
                    ? "cp-input cp-input-error"
                    : "cp-input"
                }
              />

              {errors.otp && (
                <div className="cp-form-error">
                  {errors.otp}
                </div>
              )}

            </div>

            <button
              type="submit"
              className="cp-auth-submit"
              disabled={loading}
            >
              <FaKey />

              <span>
                {loading
                  ? t("verifying")
                  : t("verifyOTP")}
              </span>
            </button>

            <button
              type="button"
              className="cp-secondary-button"
              onClick={() => {
                setStep(1);
                setOtp("");
                setErrors({});
                setMessage("");
              }}
            >
              {t("changeEmail")}
            </button>

          </form>
        )}

        {/* =================================================
            STEP 3 - NEW PASSWORD
        ================================================= */}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>

            {/* NEW PASSWORD */}

            <div className="cp-form-group">

              <label htmlFor="newPassword">
                <FaLock />
                {t("newPassword")}
              </label>

              <div className="cp-password-wrapper">

                <input
                  id="newPassword"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder={t(
                    "createNewPasswordPlaceholder"
                  )}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(
                      e.target.value
                    );
                    setErrors({});
                    setMessage("");
                  }}
                  className={
                    errors.newPassword
                      ? "cp-input cp-password-input cp-input-error"
                      : "cp-input cp-password-input"
                  }
                />

                <button
                  type="button"
                  className="cp-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? t("hidePassword")
                      : t("showPassword")
                  }
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>

              </div>

              {errors.newPassword && (
                <div className="cp-form-error">
                  {errors.newPassword}
                </div>
              )}

              <small>
                {t("passwordRequirementsHint")}
              </small>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="cp-form-group">

              <label htmlFor="confirmPassword">
                <FaLock />
                {t("confirmPassword")}
              </label>

              <div className="cp-password-wrapper">

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder={t(
                    "confirmNewPasswordPlaceholder"
                  )}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(
                      e.target.value
                    );
                    setErrors({});
                    setMessage("");
                  }}
                  className={
                    errors.confirmPassword
                      ? "cp-input cp-password-input cp-input-error"
                      : "cp-input cp-password-input"
                  }
                />

                <button
                  type="button"
                  className="cp-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? t("hidePassword")
                      : t("showPassword")
                  }
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>

              </div>

              {errors.confirmPassword && (
                <div className="cp-form-error">
                  {errors.confirmPassword}
                </div>
              )}

            </div>

            <button
              type="submit"
              className="cp-auth-submit"
              disabled={loading}
            >
              <FaLock />

              <span>
                {loading
                  ? t("resettingPassword")
                  : t("resetPassword")}
              </span>
            </button>

          </form>
        )}

        {/* =================================================
            BACK TO CORRECT LOGIN PAGE
        ================================================= */}

        <Link
          to={loginPath}
          className="cp-back-home cp-back-login"
        >
          <FaArrowLeft />
          {loginText}
        </Link>

      </div>
    </div>
  );
}

export default ForgotPassword;

