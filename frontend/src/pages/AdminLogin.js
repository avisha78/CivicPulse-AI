
import React, { useState } from "react";

import axios from "axios";

import { useNavigate, Link } from "react-router-dom";

import {
  FaUserShield,
  FaSignInAlt,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import { useAppSettings } from "../components/AppSettingsContext";

function AdminLogin() {
  const navigate = useNavigate();
  const { t } = useAppSettings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ==================================================
  // HANDLE LOGIN
  // ==================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError(t("adminEmailRequired"));
      return;
    }

    if (!password) {
      setError(t("adminPasswordRequired"));
      return;
    }

    try {
      setLoading(true);

      // ============================================
      // ADMIN LOGIN API
      // ============================================

      const response = await axios.post(
        "http://localhost:5000/api/auth/admin-login",
        {
          email: email.trim().toLowerCase(),
          password: password,
        }
      );

      console.log(
        "ADMIN LOGIN RESPONSE:",
        response.data
      );

      const data = response.data;

      // ============================================
      // CHECK USER
      // ============================================

      if (!data || !data.user) {
        setError(
          t("invalidServerResponse")
        );
        return;
      }

      // ============================================
      // CHECK ADMIN TYPE
      // ============================================

      if (data.user.type !== "admin") {
        setError(
          t("adminAccessDenied")
        );
        return;
      }

      // ============================================
      // CHECK TOKEN
      // ============================================

      if (!data.token) {
        setError(
          t("loginTokenNotReceived")
        );
        return;
      }

      // ============================================
      // SAVE LOGIN DATA
      // ============================================

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        "userType",
        "admin"
      );

      // ============================================
      // REDIRECT
      // ============================================

      navigate("/admin-dashboard", {
        replace: true,
      });

    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      if (error.response) {
        console.error(
          "SERVER RESPONSE:",
          error.response.data
        );

        setError(
          error.response.data?.message ||
            t("invalidEmailPassword")
        );

      } else if (error.request) {
        setError(
          t("serverConnectionError")
        );

      } else {
        setError(
          t("somethingWentWrong")
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="cp-auth-page">

      <div className="cp-auth-card">

        {/* ADMIN ICON */}

        <div className="cp-auth-logo">
          <FaUserShield />
        </div>

        {/* TITLE */}

        <h1>
          {t("adminLogin")}
        </h1>

        <p className="cp-auth-subtitle">
          {t("adminLoginSubtitle")}
        </p>

        {/* ERROR */}

        {error && (
          <div className="cp-error-message">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}

          <div className="cp-form-group">

            <label htmlFor="adminEmail">
              {t("adminEmail")}
            </label>

            <input
              id="adminEmail"
              type="email"
              className="cp-input"
              placeholder={t(
                "adminEmailPlaceholder"
              )}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              autoComplete="email"
            />

          </div>

          {/* PASSWORD */}

          <div className="cp-form-group">

            <label htmlFor="adminPassword">
              {t("password")}
            </label>

            <div className="cp-password-wrapper">

              <input
                id="adminPassword"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                className="cp-input"
                placeholder={t(
                  "adminPasswordPlaceholder"
                )}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="current-password"
              />

              <button
                type="button"
                className="cp-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
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

          </div>

          {/* ============================================
              FORGOT PASSWORD
          ============================================ */}

          <div className="cp-forgot-password">

            <Link
              to="/forgot-password"
              state={{ from: "admin" }}
            >
              {t("forgotPassword")}
            </Link>

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="cp-auth-button"
            disabled={loading}
          >

            <FaSignInAlt />

            {loading
              ? t("loggingIn")
              : t("adminLogin")}

          </button>

        </form>

        {/* FOOTER */}

        <div className="cp-auth-footer">

          <Link
            to="/login"
            className="cp-back-home"
          >
            <FaArrowLeft />
            {t("backToLogin")}
          </Link>

        </div>

      </div>

    </div>
  );
}

export default AdminLogin;

