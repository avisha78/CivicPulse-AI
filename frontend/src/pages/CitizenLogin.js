
import React, { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaArrowLeft,
  FaSignInAlt,
} from "react-icons/fa";

import axios from "axios";
import { useAppSettings } from "../components/AppSettingsContext";

function CitizenLogin() {
  const navigate = useNavigate();
  const { t } = useAppSettings();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = t("emailRequired");
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = t("validEmail");
    }

    if (!formData.password) {
      newErrors.password = t("passwordRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const response = await axios.post(
        "http://localhost:5000/api/auth/citizen-login",
        {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }
      );

      console.log("LOGIN RESPONSE:", response.data);

      if (response.data.requiresOTP) {
        setShowOTP(true);
        setErrors({});
        return;
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        setErrors({
          email:
            error.response.data?.message ||
            t("invalidEmailPassword"),
        });
      } else {
        setErrors({
          email: t("serverConnectionError"),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // VERIFY LOGIN OTP
  // =========================================================

  const handleVerifyOTP = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setErrors({
        otp: t("validOTP"),
      });

      return;
    }

    try {
      setOtpLoading(true);
      setErrors({});

      const response = await axios.post(
        "http://localhost:5000/api/auth/verify-login-otp",
        {
          email: formData.email.trim().toLowerCase(),
          otp: otp,
        }
      );

      console.log("OTP LOGIN RESPONSE:", response.data);

      const user = response.data.user;

      if (!user) {
        setErrors({
          otp: t("userInformationNotReceived"),
        });

        return;
      }

      // CLEAR OLD DATA
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // SAVE TOKEN
      localStorage.setItem(
        "token",
        response.data.token
      );

      // SAVE USER
      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      // SAVE CURRENT USER
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: user.id || null,
          name: user.name || "",
          email:
            user.email ||
            formData.email.trim(),
          role: user.type || "citizen",
        })
      );

      console.log(
        "CURRENT USER:",
        localStorage.getItem("currentUser")
      );

      // GO DASHBOARD
      navigate("/citizen-dashboard", {
        replace: true,
      });
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
      setOtpLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="cp-auth-page">

      <div className="cp-auth-card cp-citizen-auth-card">

        {/* ICON */}
        <div className="cp-auth-logo">
          <FaUser />
        </div>

        {/* HEADER */}
        <h1>
          {showOTP
            ? t("verifyLogin")
            : t("citizenLogin")}
        </h1>

        <p className="cp-auth-subtitle">
          {showOTP
            ? t("loginOTPDescription")
            : t("citizenLoginSubtitle")}
        </p>

        {!showOTP ? (

          <form onSubmit={handleSubmit}>

            {/* EMAIL */}
            <div className="cp-form-group">

              <label htmlFor="email">
                {t("emailAddress")}
              </label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder={t("emailPlaceholder")}
                value={formData.email}
                onChange={handleChange}
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

            {/* PASSWORD */}
            <div className="cp-form-group">

              <label htmlFor="password">
                {t("password")}
              </label>

              <div className="cp-password-wrapper">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder={t("passwordPlaceholderLogin")}
                  value={formData.password}
                  onChange={handleChange}
                  className={
                    errors.password
                      ? "cp-input cp-password-input cp-input-error"
                      : "cp-input cp-password-input"
                  }
                />

                <button
                  type="button"
                  className="cp-password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>

              </div>

              {errors.password && (
                <div className="cp-form-error">
                  {errors.password}
                </div>
              )}

            </div>

            {/* REMEMBER */}
            <div className="cp-remember-row">

              <label className="cp-checkbox-label">

                <input
                  type="checkbox"
                  id="remember"
                />

                <span>
                  {t("rememberMe")}
                </span>

              </label>

            </div>

            {/* FORGOT PASSWORD */}
            <div className="cp-forgot-password">

              <Link
                to="/forgot-password"
                state={{ from: "citizen" }}
              >
                {t("forgotPassword")}
              </Link>

            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="cp-auth-submit"
              disabled={loading}
            >

              <FaSignInAlt />

              <span>
                {loading
                  ? t("sendingOTP")
                  : t("login")}
              </span>

            </button>

            {/* REGISTER */}
            <div className="cp-auth-register">

              <span>
                {t("dontHaveAccount")}
              </span>

              <Link to="/register">
                {t("registerHere")}
              </Link>

            </div>

          </form>

        ) : (

          /* =================================================
             OTP FORM
          ================================================= */

          <div>

            <div
              style={{
                textAlign: "center",
                marginBottom: "25px",
              }}
            >

              <div
                style={{
                  fontSize: "45px",
                  marginBottom: "10px",
                }}
              >
                📧
              </div>

              <p>
                {t("loginOTPSentTo")}
              </p>

              <strong>
                {formData.email}
              </strong>

            </div>

            {/* OTP */}
            <div className="cp-form-group">

              <label>
                {t("enterSixDigitOTP")}
              </label>

              <input
                type="text"
                placeholder={t("otpPlaceholder")}
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                maxLength="6"
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

            {/* VERIFY */}
            <button
              type="button"
              className="cp-auth-submit"
              onClick={handleVerifyOTP}
              disabled={otpLoading}
            >

              <FaSignInAlt />

              <span>
                {otpLoading
                  ? t("verifying")
                  : t("verifyOTP")}
              </span>

            </button>

            {/* BACK */}
            <button
              type="button"
              onClick={() => {
                setShowOTP(false);
                setOtp("");
                setErrors({});
              }}
              style={{
                width: "100%",
                marginTop: "15px",
                padding: "10px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              ← {t("backToLogin")}
            </button>

          </div>

        )}

        {/* BACK */}
        {!showOTP && (
          <Link
            to="/login"
            className="cp-back-home cp-back-login"
          >
            <FaArrowLeft />
            {t("backToLogin")}
          </Link>
        )}

      </div>

    </div>
  );
}

export default CitizenLogin;

